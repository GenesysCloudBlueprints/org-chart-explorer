// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.crypto for PKCE tests
const mockCrypto = {
	getRandomValues: (array: Uint8Array) => {
		for (let i = 0; i < array.length; i++) {
			array[i] = Math.floor(Math.random() * 256);
		}
		return array;
	},
	subtle: {
		digest: async (algorithm: string, data: BufferSource) => {
			// Simple mock implementation for testing
			const buffer = new ArrayBuffer(32);
			const view = new Uint8Array(buffer);
			for (let i = 0; i < 32; i++) {
				view[i] = i;
			}
			return buffer;
		},
	},
};

// Only mock if crypto is not available (for test environments)
if (typeof window !== 'undefined' && !window.crypto) {
	Object.defineProperty(window, 'crypto', {
		value: mockCrypto,
		writable: true,
	});
}

// Mock btoa globally as a jest mock
global.btoa = jest.fn((str: string) => {
	if (!str) return '';
	return Buffer.from(str, 'binary').toString('base64');
});

// Mock TextEncoder for PKCE
if (typeof global.TextEncoder === 'undefined') {
	global.TextEncoder = class TextEncoder {
		encode(str: string): Uint8Array {
			return new Uint8Array(Buffer.from(str, 'utf-8'));
		}
	} as any;
}

// Mock recoil-nexus for tests
jest.mock('recoil-nexus', () => ({
	setRecoil: jest.fn(),
	getRecoil: jest.fn(),
	RecoilRoot: ({ children }: any) => children,
}));

