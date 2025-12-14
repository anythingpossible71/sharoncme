import prompts from "prompts";

/**
 * User prompt utilities with cross-platform support
 */

/**
 * Ask yes/no question
 */
export async function confirm(message, initial = true) {
  const response = await prompts({
    type: "confirm",
    name: "value",
    message,
    initial,
  });

  // Handle Ctrl+C
  if (response.value === undefined) {
    process.exit(0);
  }

  return response.value;
}

/**
 * Ask for text input
 */
export async function text(message, initial = "") {
  const response = await prompts({
    type: "text",
    name: "value",
    message,
    initial,
  });

  // Handle Ctrl+C
  if (response.value === undefined) {
    process.exit(0);
  }

  return response.value;
}

/**
 * Ask for selection from options
 */
export async function select(message, choices) {
  const response = await prompts({
    type: "select",
    name: "value",
    message,
    choices,
  });

  // Handle Ctrl+C
  if (response.value === undefined) {
    process.exit(0);
  }

  return response.value;
}

/**
 * Ask for multiple selections
 */
export async function multiselect(message, choices) {
  const response = await prompts({
    type: "multiselect",
    name: "value",
    message,
    choices,
  });

  // Handle Ctrl+C
  if (response.value === undefined) {
    process.exit(0);
  }

  return response.value;
}

/**
 * Show a list of options for error recovery
 */
export async function errorRecovery(errorMessage) {
  console.error("\n" + errorMessage);

  const response = await prompts({
    type: "select",
    name: "action",
    message: "How would you like to proceed?",
    choices: [
      { title: "Retry", value: "retry" },
      { title: "Skip this step", value: "skip" },
      { title: "Quit setup", value: "quit" },
    ],
  });

  // Handle Ctrl+C
  if (response.action === undefined) {
    process.exit(0);
  }

  return response.action;
}
