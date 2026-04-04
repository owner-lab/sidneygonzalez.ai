/**
 * Pyodide Web Worker — loads Python runtime from CDN and executes code.
 *
 * This file lives in public/ (NOT src/) so Vite does not bundle it.
 * Vite 8's Rolldown bundler would break the CDN import below.
 *
 * Pyodide version: 0.29.3
 * ⚠️  If upgrading, also update src/python/pyodideConfig.js
 *
 * Sources:
 * - https://pyodide.org/en/stable/usage/webworker.html
 * - https://pyodide.org/en/stable/usage/working-with-bundlers.html
 */

// CDN import — official Pyodide pattern for module workers
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.mjs";

let pyodide = null;
const dataCache = new Map(); // filename -> CSV content string

function post(msg) {
  self.postMessage(msg);
}

async function initPyodide() {
  try {
    post({ type: "progress", percent: 10, label: "Downloading Python runtime..." });

    pyodide = await loadPyodide();

    post({ type: "progress", percent: 40, label: "Installing package manager..." });

    await pyodide.loadPackage("micropip");

    post({ type: "progress", percent: 60, label: "Installing pandas..." });

    const micropip = pyodide.pyimport("micropip");
    await micropip.install("pandas");

    post({ type: "progress", percent: 90, label: "Verifying packages..." });

    // Verify core packages load
    await pyodide.runPythonAsync("import numpy; import pandas");

    // Create /data directory in virtual filesystem
    pyodide.FS.mkdir("/data");

    post({ type: "progress", percent: 100, label: "Ready" });
    post({ type: "ready" });
  } catch (err) {
    post({ type: "error", message: err.message || "Failed to initialize Python runtime" });
  }
}

async function loadCsvFiles(csvFiles) {
  for (const filename of csvFiles) {
    if (dataCache.has(filename)) continue;

    // Fetch from same-origin /data/ — no CORS issues
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch /data/${filename}: ${response.status}`);
    }
    const content = await response.text();
    dataCache.set(filename, content);

    // Write to Pyodide virtual filesystem
    pyodide.FS.writeFile(`/data/${filename}`, content);
  }
}

async function runPython(id, python, context) {
  if (!pyodide) {
    post({ type: "error", id, message: "Python runtime not initialized" });
    return;
  }

  try {
    // Load any requested CSV files into virtual filesystem
    if (context && context.csvFiles) {
      await loadCsvFiles(context.csvFiles);
    }

    // Set context variables as Python globals (official pattern)
    if (context && context.params) {
      for (const [key, value] of Object.entries(context.params)) {
        pyodide.globals.set(key, value);
      }
    }

    // Execute Python code
    await pyodide.runPythonAsync(python);

    // Read result — Python code should set a 'result' variable
    const resultProxy = pyodide.globals.get("result");
    let result;

    if (resultProxy && typeof resultProxy.toJs === "function") {
      result = resultProxy.toJs({ dict_converter: Object.fromEntries });
      resultProxy.destroy(); // prevent memory leak
    } else {
      // Primitive type (number, string, boolean)
      result = resultProxy;
    }

    post({ type: "result", id, data: result });
  } catch (err) {
    post({ type: "error", id, message: err.message || "Python execution failed" });
  }
}

async function loadPackages(packages) {
  if (!pyodide) {
    post({ type: "error", message: "Cannot load packages — runtime not initialized" });
    return;
  }

  try {
    post({ type: "progress", percent: 50, label: `Installing ${packages.join(", ")}...` });

    const micropip = pyodide.pyimport("micropip");
    for (const pkg of packages) {
      await micropip.install(pkg);
    }

    // Verify imports
    for (const pkg of packages) {
      const importName = pkg.replace("-", "_"); // scikit-learn -> scikit_learn
      await pyodide.runPythonAsync(`import ${importName}`);
    }

    post({ type: "progress", percent: 100, label: "Ready" });
    post({ type: "ready" });
  } catch (err) {
    post({ type: "error", message: `Failed to install packages: ${err.message}` });
  }
}

// Message dispatcher
self.onmessage = async ({ data: msg }) => {
  switch (msg.type) {
    case "init":
      await initPyodide();
      break;
    case "run":
      await runPython(msg.id, msg.python, msg.context);
      break;
    case "load-packages":
      await loadPackages(msg.packages);
      break;
    default:
      post({ type: "error", message: `Unknown message type: ${msg.type}` });
  }
};
