import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Test validation errors
async function testValidationErrors() {
    console.log('Testing Zod validation error formatting...\n');

    try {
        // Test signup with invalid data
        console.log('1. Testing signup with invalid data:');
        const signupResponse = await axios.post(`${BASE_URL}/auth/register`, {
            email: 'invalid-email',
            password: '123', // too short
            name: '', // empty
            pin: '12', // too short
        });
        console.log('Signup response:', signupResponse.data);
    } catch (error: any) {
        console.log('Signup validation error:');
        console.log(JSON.stringify(error.response?.data, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    try {
        // Test transfer with invalid data
        console.log('2. Testing transfer with invalid data:');
        const transferResponse = await axios.post(
            `${BASE_URL}/transfers`,
            {
                toAccountNumber: '',
                amount: -100, // negative
                description: 'A'.repeat(300), // too long
            },
            {
                headers: {
                    Authorization: 'Bearer fake-token',
                    'Idempotency-Key': 'test-key',
                },
            },
        );
        console.log('Transfer response:', transferResponse.data);
    } catch (error: any) {
        console.log('Transfer validation error:');
        console.log(JSON.stringify(error.response?.data, null, 2));
    }

    console.log('\n' + '='.repeat(50) + '\n');

    try {
        // Test invoice creation with invalid data
        console.log('3. Testing invoice creation with invalid data:');
        const invoiceResponse = await axios.post(
            `${BASE_URL}/invoices`,
            {
                amount: 'not-a-number',
                webhookUrl: 'invalid-url',
                reference: '',
            },
            {
                headers: {
                    Authorization: 'Bearer fake-api-key',
                },
            },
        );
        console.log('Invoice response:', invoiceResponse.data);
    } catch (error: any) {
        console.log('Invoice validation error:');
        console.log(JSON.stringify(error.response?.data, null, 2));
    }
}

testValidationErrors().catch(console.error);
