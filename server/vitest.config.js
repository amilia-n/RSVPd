import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Setup file runs before all tests
    setupFiles: ['./tests/setup.js'],

    // Test environment
    environment: 'node',
    globals: false,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // Reporting
    reporter: ['verbose'],

    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'scripts/',
        'src/db/seed.js',
      ],
    },

    // Test environment variables
    env: {
      NODE_ENV: 'test',
      PORT: '8888',
      CORS_ORIGIN: 'http://localhost:3000',

      // Database configuration for tests
      DATABASE_URL: 'postgres://postgres:testpassword@test-db:5432/rsvp_test',

      // JWT configuration
      JWT_SECRET: 'test_jwt_secret_for_testing_only',
      JWT_EXPIRES: '1h',

      // Stripe configuration (test mode)
      STRIPE_SECRET: 'sk_test_fake_key_for_testing',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_fake_webhook_secret',
      CHECKOUT_SUCCESS_URL: 'http://localhost:3000/success',
      CHECKOUT_CANCEL_URL: 'http://localhost:3000/cancel',

      // App configuration
      APP_BASE_URL: 'http://localhost:3000',
      QR_HMAC_SECRET: 'test-qr-secret-for-testing',

      // MagicBell configuration (test mode)
      MAGICBELL_API_KEY: 'test_magicbell_key',
      MAGICBELL_API_SECRET: 'test_magicbell_secret',

      // Cookie configuration
      COOKIE_NAME: 'access',
    },
  },
});
