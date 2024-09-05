/* eslint-disable prettier/prettier */
export default {
    coverageDirectory: '../../coverage/packages/core',
    displayName: 'core',
    moduleFileExtensions: ['js', 'ts'],
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
};
