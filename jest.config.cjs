/** @type {import('jest').Config} */
module.exports = {
    roots: ["<rootDir>/frontend/tests"],
    testMatch: ["**/*.test.js"],
    testEnvironment: "jsdom",
    moduleFileExtensions: ["js", "json"],
    transform: {},
    collectCoverageFrom: ["frontend/js/**/*.js"],
    coveragePathIgnorePatterns: ["/node_modules/"],
    testPathIgnorePatterns: ["/node_modules/"],
    testResultsProcessor: "./node_modules/jest-stare",
};
