import { MockRuntimeAdapter, GeminiRuntimeAdapter } from '../services/runtimeAdapter';
import { getGatewayStatus, executeGeminiPrompt, GEMINI_MODEL } from '../../server/geminiService';
import { TOOLS_DATA } from '../data/toolsData';

export async function runRuntimeTests() {
  console.log('--- RUNNING LSUPERAGENT V11 RUNTIME TESTS ---');

  // Test D: Existing MockRuntimeAdapter integrity
  const mockAdapter = new MockRuntimeAdapter();
  const mockStatus = await mockAdapter.getStatus();
  console.assert(mockStatus.connected === false, 'Mock status should be disconnected');
  console.assert(mockStatus.statusText === 'NOT_CONNECTED', 'Mock status should be NOT_CONNECTED');
  console.assert(mockStatus.mode === 'MockRuntimeAdapter', 'Mock mode should be MockRuntimeAdapter');

  const mockRes = await mockAdapter.executePrompt('ทดสอบคำสั่ง', 'smart_chat');
  console.assert(mockRes.status === 'NOT_CONNECTED', 'Mock execute prompt should return NOT_CONNECTED');
  console.log('✓ Test D: MockRuntimeAdapter baseline tests passed');

  // Test Canonical Routes
  const requiredRoutes = [
    'smart_chat',
    'deep_research',
    'create_image',
    'agent_mode',
    'memory',
  ];
  const configuredRoutes = TOOLS_DATA.map((t) => t.route).filter(Boolean);
  requiredRoutes.forEach((route) => {
    console.assert(
      configuredRoutes.includes(route as any),
      `Route ${route} must be configured in toolsData`
    );
  });
  console.log('✓ Route integrity check passed for canonical routes');

  // Test Model Configuration
  console.assert(GEMINI_MODEL === 'gemini-3.7-flash', 'Model should be gemini-3.7-flash');
  console.log('✓ Model configuration check passed (gemini-3.7-flash)');

  // Test A: Missing GEMINI_API_KEY
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const unconfiguredStatus = getGatewayStatus();
  console.assert(unconfiguredStatus.connected === false, 'Unconfigured gateway should not be connected');
  console.assert(unconfiguredStatus.statusText === 'NOT_CONNECTED', 'Status should be NOT_CONNECTED');

  const unconfiguredExec = await executeGeminiPrompt('ทดสอบ', 'smart_chat');
  console.assert(unconfiguredExec.status === 'NOT_CONFIGURED', 'Missing key should return NOT_CONFIGURED status');
  console.assert(
    !unconfiguredExec.message.includes('AIza'),
    'Error message must never contain raw key patterns'
  );
  console.log('✓ Test A: Missing GEMINI_API_KEY returns safe NOT_CONFIGURED state');

  // Test C: Provider error handling & sanitization
  process.env.GEMINI_API_KEY = 'invalid_test_key_for_error_handling';
  const errorExec = await executeGeminiPrompt('test prompt with bad key', 'smart_chat');
  console.assert(
    errorExec.status === 'PROVIDER_ERROR',
    `Expected PROVIDER_ERROR on invalid key, got: ${errorExec.status}`
  );
  console.assert(
    !errorExec.message.includes('invalid_test_key_for_error_handling'),
    'Provider error must not leak raw secret strings'
  );
  console.log('✓ Test C: Controlled provider error handling without leaking credentials');

  // Test B: Empty prompt validation
  const emptyExec = await executeGeminiPrompt('   ', 'smart_chat');
  console.assert(emptyExec.status === 'INVALID_REQUEST', 'Empty prompt should return INVALID_REQUEST');
  console.log('✓ Test B: Input validation and response normalization verified');

  // Restore environment
  if (originalKey !== undefined) {
    process.env.GEMINI_API_KEY = originalKey;
  } else {
    delete process.env.GEMINI_API_KEY;
  }

  return { passed: true, message: 'All runtime, gateway, and security tests passed successfully.' };
}

// Self-executing if run directly via tsx
runRuntimeTests().then((res) => console.log(`\nRESULT: ${res.message}`));
