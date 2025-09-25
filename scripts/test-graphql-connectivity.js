#!/usr/bin/env node
/**
 * BrAve Forms GraphQL Connectivity Test
 * Tests GraphQL endpoint availability and basic queries
 */

const https = require('https');
const http = require('http');

// Test configuration
const config = {
  endpoint: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/graphql',
  timeout: 10000,
  maxRetries: 3
};

console.log('🔌 BrAve Forms GraphQL Connectivity Test');
console.log('==========================================');
console.log(`Testing endpoint: ${config.endpoint}`);

/**
 * Make GraphQL request
 */
async function makeGraphQLRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.endpoint);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify({
      query,
      variables
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json'
      },
      timeout: config.timeout
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Test basic connectivity
 */
async function testConnectivity() {
  console.log('\n1. Testing Basic Connectivity');
  console.log('============================');
  
  try {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType {
            name
          }
          mutationType {
            name
          }
          subscriptionType {
            name
          }
        }
      }
    `;
    
    const response = await makeGraphQLRequest(introspectionQuery);
    
    if (response.statusCode === 200) {
      console.log('✅ GraphQL endpoint is accessible');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Query Type: ${response.data.data?.__schema?.queryType?.name || 'Unknown'}`);
      console.log(`   Mutation Type: ${response.data.data?.__schema?.mutationType?.name || 'Unknown'}`);
      return true;
    } else {
      console.log(`❌ GraphQL endpoint returned status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Test EPA compliance queries
 */
async function testComplianceQueries() {
  console.log('\n2. Testing EPA Compliance Queries');
  console.log('=================================');
  
  const testQueries = [
    {
      name: 'Rain Trigger Check',
      query: `
        query TestRainTrigger($location: LocationInput!, $date: String!) {
          checkRainTrigger(location: $location, date: $date) {
            triggered
            precipitationAmount
            threshold
            deadline
          }
        }
      `,
      variables: {
        location: { lat: 40.7128, lng: -74.0060 },
        date: new Date().toISOString().split('T')[0]
      }
    },
    {
      name: 'Compliance Status',
      query: `
        query TestComplianceStatus($projectId: ID!) {
          project(id: $projectId) {
            id
            name
            complianceStatus {
              status
              lastInspection
              nextDeadline
            }
          }
        }
      `,
      variables: {
        projectId: 'test-project-id'
      }
    },
    {
      name: 'Weather Monitoring',
      query: `
        query TestWeatherMonitoring($location: LocationInput!) {
          currentWeather(location: $location) {
            temperature
            precipitation24h
            windSpeed
            conditions
          }
        }
      `,
      variables: {
        location: { lat: 40.7128, lng: -74.0060 }
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const test of testQueries) {
    try {
      console.log(`\nTesting: ${test.name}`);
      const response = await makeGraphQLRequest(test.query, test.variables);
      
      if (response.statusCode === 200 && !response.data.errors) {
        console.log(`✅ ${test.name}: Query executed successfully`);
        passedTests++;
      } else if (response.data.errors) {
        console.log(`⚠️  ${test.name}: Schema/resolver not implemented yet`);
        console.log(`   Errors: ${response.data.errors.map(e => e.message).join(', ')}`);
      } else {
        console.log(`❌ ${test.name}: HTTP ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  return passedTests;
}

/**
 * Test authentication
 */
async function testAuthentication() {
  console.log('\n3. Testing Authentication');
  console.log('========================');
  
  try {
    const authQuery = `
      query TestAuth {
        me {
          id
          email
          organization {
            id
            name
            slug
          }
        }
      }
    `;
    
    // Test without token (should fail)
    const response = await makeGraphQLRequest(authQuery);
    
    if (response.data.errors && response.data.errors.some(e => e.message.includes('Unauthorized'))) {
      console.log('✅ Authentication required (as expected)');
      console.log('   Note: This is correct - authentication should be required');
      return true;
    } else {
      console.log('⚠️  Authentication not enforced or not configured');
      return false;
    }
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test database connectivity through GraphQL
 */
async function testDatabaseConnectivity() {
  console.log('\n4. Testing Database Connectivity');
  console.log('===============================');
  
  try {
    const healthQuery = `
      query HealthCheck {
        health {
          status
          database {
            connected
            latency
          }
          redis {
            connected
            latency
          }
        }
      }
    `;
    
    const response = await makeGraphQLRequest(healthQuery);
    
    if (response.statusCode === 200 && !response.data.errors) {
      const health = response.data.data?.health;
      if (health) {
        console.log('✅ Health check endpoint working');
        console.log(`   Database: ${health.database?.connected ? 'Connected' : 'Disconnected'}`);
        console.log(`   Redis: ${health.redis?.connected ? 'Connected' : 'Disconnected'}`);
        return true;
      } else {
        console.log('⚠️  Health check returned no data');
        return false;
      }
    } else {
      console.log('⚠️  Health check endpoint not implemented');
      console.log('   This is expected if the health resolver hasn\'t been created yet');
      return false;
    }
  } catch (error) {
    console.log(`❌ Database connectivity test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  const results = {
    connectivity: false,
    compliance: 0,
    authentication: false,
    database: false
  };
  
  console.log('Starting GraphQL connectivity tests...\n');
  
  // Test 1: Basic connectivity
  results.connectivity = await testConnectivity();
  
  if (!results.connectivity) {
    console.log('\n❌ Basic connectivity failed. Ensure backend is running on the configured port.');
    process.exit(1);
  }
  
  // Test 2: EPA compliance queries
  results.compliance = await testComplianceQueries();
  
  // Test 3: Authentication
  results.authentication = await testAuthentication();
  
  // Test 4: Database connectivity
  results.database = await testDatabaseConnectivity();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('==============');
  console.log(`✅ Basic Connectivity: ${results.connectivity ? 'PASS' : 'FAIL'}`);
  console.log(`⚠️  Compliance Queries: ${results.compliance}/3 working (expected during development)`);
  console.log(`✅ Authentication: ${results.authentication ? 'PASS' : 'FAIL'}`);
  console.log(`⚠️  Database Health: ${results.database ? 'PASS' : 'Not Implemented'}`);
  
  if (results.connectivity && results.authentication) {
    console.log('\n🎉 Core GraphQL functionality is working!');
    console.log('Note: Some queries may fail during development - this is expected.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some core functionality is not working. Check the backend configuration.');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\nTest interrupted by user');
  process.exit(130);
});

// Run tests
runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});