// ********************** Initialize server **********************************

const server = require('../index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;
const bcryptjs = require('bcryptjs');


// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
    // Sample test case given to test / endpoint.
    it('Returns the default welcome message', done => {
        chai
            .request(server)
            .get('/welcome')
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.equals(true);
                assert.strictEqual(res.body.message, 'Welcome!');
                done();
            });
    });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************


// Example Positive Testcase :
// API: /add_user
// Input: {id: 5, name: 'John Doe', dob: '2020-02-20'}
// Expect: res.status == 200 and res.body.message == 'Success'
// Result: This test case should pass and return a status 200 along with a "Success" message.
// Explanation: The testcase will call the /add_user API with the following input
// and expects the API to return a status of 200 along with the "Success" message.

describe('Testing Add User API', () => {
    it('positive : /register', done => {
        chai
            .request(server)
            .post('/register')
            .send({ user_id: 4, username: 'rickey', password: 'ricky123', email: 'ricky.ricky@example.com' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });

    // Example Negative Testcase :
    // API: /add_user
    // Input: {id: 5, name: 10, dob: '2020-02-20'}
    // Expect: res.status == 400 and res.body.message == 'Invalid input'
    // Result: This test case should pass and return a status 400 along with a "Invalid input" message.
    // Explanation: The testcase will call the /add_user API with the following invalid inputs
    // and expects the API to return a status of 400 along with the "Invalid input" message.
    it('Negative : /register. Checking invalid name', done => {
        chai
            .request(server)
            .post('/register')
            .send({ user_id: 1, username: 'user1', password: 'user123', email: 'user1@colorado.edu' })
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body.error).to.equals('Username already exists. Please try again.');
                done();
            });
    });
});

describe('Testing Redirect', () => {
    // Sample test case given to test /test endpoint.
    it('test route should redirect to /login with 302 HTTP status code', done => {
        chai
            .request(server)
            .get('/test')
            .redirects(0)  // Don't follow redirects - stop at 302
            .end((err, res) => {
                console.log(res.body);
                res.should.have.status(302); // Expecting a redirect status code
                res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); // Expecting a redirect to /login with the mentioned Regex
                done();
            });
    });
});

describe('Testing Render', () => {
    // Sample test case given to test /test endpoint.
    it('test "/login" route should render with an html response', done => {
        chai
            .request(server)
            .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
            .end((err, res) => {
                res.should.have.status(200); // Expecting a success status code
                res.should.be.html; // Expecting a HTML response
                done();
            });
    });
});

describe('Profile Route Tests', () => {

    describe('GET /profile', () => {

        it('should return 401 if user is not authenticated', done => {
            chai
                .request(server)
                .get('/profile')
                .set('Accept', 'application/json')
                .end((err, res) => {
                    console.log(res.body);
                    expect(res).to.have.status(401);
                    expect(res.body.message).to.equal('Not authenticated');
                    done();
                });
        });

        it('should return user profile when authenticated', done => {
            const agent = chai.request.agent(server); // Create persistent agent

            // First login
            agent
                .post('/login')
                .send({
                    username: 'user1',
                    password: 'user123',
                    email: 'user1@colorado.edu',
                })
                .end((err, res) => {
                    expect(res).to.have.status(200);

                    // Now access profile with same agent (cookies preserved)
                    agent
                        .get('/profile')
                        .set('Accept', 'application/json')  // Request JSON instead of HTML
                        .end((err, res) => {
                            expect(res).to.have.status(200);
                            console.log(res.body);
                            expect(res.body).to.be.an('object');
                            expect(res.body).to.have.property('username', 'user1');
                            agent.close(); // Clean up
                            done(); // Only call done() once at the end
                        });
                });
        });
    });
});


// ********************************************************************************