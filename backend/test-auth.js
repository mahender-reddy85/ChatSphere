import { config } from 'dotenv';
config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function testAuth() {
  try {
    // Test registration
    console.log('Testing registration...');
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        password: 'testpass123'
      })
    });
    
    if (!registerRes.ok) {
      const error = await registerRes.json().catch(() => ({}));
      throw new Error(error.message || 'Registration failed');
    }
    
    const { token, user } = await registerRes.json();
    console.log('✅ Registration successful');
    console.log('User:', user);
    
    // Test login
    console.log('\nTesting login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        password: 'testpass123'
      })
    });
    
    if (!loginRes.ok) {
      const error = await loginRes.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Login successful');
    
    // Test protected me endpoint
    console.log('\nTesting protected /me endpoint...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!meRes.ok) {
      const error = await meRes.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to fetch user data');
    }
    
    const meData = await meRes.json();
    console.log('✅ User data retrieved successfully');
    console.log('User:', meData.user);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAuth();
