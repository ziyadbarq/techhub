module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(message) => message.startsWith("Merge ")],
  rules: {
    "subject-case": [0],
  },
};
