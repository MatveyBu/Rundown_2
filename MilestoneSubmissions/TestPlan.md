# Rundown - Test Plan Documentation

**Team #:** 4  
**Team Name:** CookedCoders  
**Application:** Rundown - College Forum Platform  
**Date:** November 18, 2025  
**Version:** 1.0

---

## Table of Contents
1. [Test Feature 1: User Login with Valid Credentials](#test-feature-1-user-login-with-valid-credentials)
2. [Test Feature 2: User Registration with Invalid Credentials](#test-feature-2-user-registration-with-invalid-credentials)
3. [Test Feature 3: Banned User Access Control](#test-feature-3-banned-user-access-control)

---

## Test Feature 1: User Login with Valid Credentials

### Feature Description
User should be able to login with correct credentials. The user will submit their username/email and password to access their profile and return to the home screen.

### Test Scenario
User is attempting to log back into their existing Rundown account to access the home page and community features.

### Test Cases

#### Test Case 1.1: Successful Login - Standard User
**Test Case ID:** TC-LOGIN-001  
**Priority:** High  
**Preconditions:** 
- User account exists in database
- User is not currently logged in
- User has valid credentials

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter username: `user1`
3. Enter password: `user123`
4. Click "Login" button

**Test Data:**
- Username: `user1`
- Password: `user123`
- User Role: user
- Email: `user1@colorado.edu`

**Expected Results:**
- User is redirected to `/home` page
- Profile icon appears in top-right corner with user's initial "J"
- User name "John Doe" is displayed in profile section
- Role badge shows "user"
- Session is created and maintained
- All home page components are visible (Hero section, Quick Access, Recent Activity, Stats)

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 1.2: Successful Login - Moderator
**Test Case ID:** TC-LOGIN-002  
**Priority:** High  
**Preconditions:** 
- Moderator account exists in database
- Moderator is not currently logged in
- Moderator has valid credentials

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter username: `moderator1`
3. Enter password: `mod123`
4. Click "Login" button

**Test Data:**
- Username: `moderator1`
- Password: `mod123`
- User Role: moderator
- Email: `moderator1@colorado.edu`
- Community: Housing

**Expected Results:**
- Moderator is redirected to `/home` page
- Profile icon appears with initial "J"
- User name "Jane Smith" is displayed
- Role badge shows "moderator"
- Session includes community-specific authority (Housing)
- Moderator can access community-specific moderation features

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 1.3: Successful Login - Admin
**Test Case ID:** TC-LOGIN-003  
**Priority:** High  
**Preconditions:** 
- Admin account exists in database
- Admin is not currently logged in
- Admin has valid credentials

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter username: `admin1`
3. Enter password: `admin123`
4. Click "Login" button

**Test Data:**
- Username: `admin1`
- Password: `admin123`
- User Role: admin
- Email: `admin1@colorado.edu`

**Expected Results:**
- Admin is redirected to `/home` page
- Profile icon appears with initial "A"
- User name "Admin User" is displayed
- Role badge shows "admin"
- Session includes global authority
- Admin can access all administrative features

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 1.4: Failed Login - Invalid Password
**Test Case ID:** TC-LOGIN-004  
**Priority:** High  
**Preconditions:** 
- User account exists in database
- User is not currently logged in

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter username: `user1`
3. Enter incorrect password: `wrongpassword`
4. Click "Login" button

**Test Data:**
- Username: `user1`
- Password: `wrongpassword` (incorrect)

**Expected Results:**
- User remains on `/login` page
- Error message displayed: "Invalid username or password"
- Username field retains entered value
- Password field is cleared
- No session is created

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 1.5: Failed Login - Invalid Username
**Test Case ID:** TC-LOGIN-005  
**Priority:** High  
**Preconditions:** 
- User is not currently logged in

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter non-existent username: `nonexistentuser`
3. Enter password: `anypassword`
4. Click "Login" button

**Test Data:**
- Username: `nonexistentuser` (does not exist)
- Password: `anypassword`

**Expected Results:**
- User remains on `/login` page
- Error message displayed: "Invalid username or password"
- No session is created
- No database query errors

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 1.6: Session Persistence
**Test Case ID:** TC-LOGIN-006  
**Priority:** Medium  
**Preconditions:** 
- User is logged in

**Test Steps:**
1. Login with valid credentials
2. Navigate to different pages within the application
3. Close browser tab (but not browser)
4. Reopen application in new tab

**Test Data:**
- Username: `user1`
- Password: `user123`

**Expected Results:**
- Session persists across page navigation
- User remains logged in after reopening tab
- Profile information remains displayed correctly
- No re-authentication required

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 1.7: Logout Functionality
**Test Case ID:** TC-LOGIN-007  
**Priority:** High  
**Preconditions:** 
- User is logged in

**Test Steps:**
1. Login with valid credentials
2. Click "Logout" button in profile header
3. Attempt to access `/home` directly

**Test Data:**
- Username: `user1`
- Password: `user123`

**Expected Results:**
- Session is destroyed
- User is redirected to `/login` page
- Attempting to access `/home` redirects to `/login`
- Profile information is cleared

**Actual Results:**
_To be filled after test execution_

---

### Test Environment
- **Platform:** localhost
- **URL:** http://localhost:3000
- **Server:** Node.js with Express.js
- **Port:** 3000
- **Database:** Mock user database (plainUsers array in index.js)
  - Will migrate to PostgreSQL in cloud deployment
- **Session Management:** express-session with in-memory store
- **Authentication:** Password comparison (plain text for testing, will use bcrypt in production)
- **Browser:** Chrome, Firefox, Safari (latest versions)
- **Operating System:** macOS, Windows, Linux

### Test Data Summary
```javascript
// Test Users in Database
const testUsers = [
  {
    username: 'user1',
    password: 'user123',
    role: 'user',
    name: 'John Doe',
    email: 'user1@colorado.edu'
  },
  {
    username: 'moderator1',
    password: 'mod123',
    role: 'moderator',
    name: 'Jane Smith',
    email: 'moderator1@colorado.edu',
    community: 'Housing'
  },
  {
    username: 'admin1',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    email: 'admin1@colorado.edu'
  }
];
```

### User Acceptance Testers
- **Tester 1:** RJ Wiebe (Frontend Developer) - rowi2520@colorado.edu
- **Tester 2:** Baden Miles (Frontend Developer) - bami6878@colorado.edu
- **Tester 3:** Ryan Murray (Backend Developer) - rymu8585@colorado.edu
- **Tester 4:** Any team member with access to test accounts
- **Requirement:** Testers must have logged in previously or use provided test credentials
- **Test Profiles:** Fake profiles created specifically for testing (user1, moderator1, admin1)

### Success Criteria
- ✅ All three user roles can successfully login
- ✅ Password verification works correctly
- ✅ Invalid credentials are properly rejected
- ✅ Session management functions as expected
- ✅ Profile information displays correctly on home page
- ✅ Logout functionality works properly
- ✅ No security vulnerabilities in authentication flow

---

## Test Feature 2: User Registration with Invalid Credentials

### Feature Description
User registration should fail when the user provides invalid credentials. The system will validate school email authenticity and username uniqueness before creating a new user account.

### Test Scenario
A new user is attempting to register for a Rundown account by submitting username, password, and school email into the registration form.

### Test Cases

#### Test Case 2.1: Failed Registration - Invalid Email Format
**Test Case ID:** TC-REG-001  
**Priority:** High  
**Preconditions:** 
- User is on registration page
- User has not registered before

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Enter username: `newuser1`
3. Enter password: `Password123!`
4. Enter email: `notanemail@invalid` (invalid format)
5. Click "Register" button

**Test Data:**
- Username: `newuser1`
- Password: `Password123!`
- Email: `notanemail@invalid`
- Expected Validation: Email format check fails

**Expected Results:**
- Registration fails
- Error message displayed: "Please enter a valid email address"
- User remains on registration page
- No user account created in database
- Form fields retain entered values (except password)

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 2.2: Failed Registration - Non-CU Boulder Email
**Test Case ID:** TC-REG-002  
**Priority:** High  
**Preconditions:** 
- User is on registration page

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Enter username: `newuser2`
3. Enter password: `Password123!`
4. Enter email: `user@gmail.com` (not @colorado.edu)
5. Click "Register" button

**Test Data:**
- Username: `newuser2`
- Password: `Password123!`
- Email: `user@gmail.com`
- Expected Validation: School email domain check fails

**Expected Results:**
- Registration fails
- Error message displayed: "Please use your CU Boulder email address (@colorado.edu)"
- User remains on registration page
- No user account created
- API verification confirms non-school email

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 2.3: Failed Registration - Duplicate Username
**Test Case ID:** TC-REG-003  
**Priority:** High  
**Preconditions:** 
- Username `user1` already exists in database

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Enter username: `user1` (already exists)
3. Enter password: `NewPassword123!`
4. Enter email: `newuser@colorado.edu`
5. Click "Register" button

**Test Data:**
- Username: `user1` (duplicate)
- Password: `NewPassword123!`
- Email: `newuser@colorado.edu`
- Database Check: Username uniqueness validation

**Expected Results:**
- Registration fails
- Error message displayed: "Username already exists. Please choose another."
- User remains on registration page
- No new user account created
- Database maintains data integrity

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 2.4: Failed Registration - Weak Password
**Test Case ID:** TC-REG-004  
**Priority:** Medium  
**Preconditions:** 
- User is on registration page

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Enter username: `newuser3`
3. Enter password: `123` (too weak)
4. Enter email: `newuser3@colorado.edu`
5. Click "Register" button

**Test Data:**
- Username: `newuser3`
- Password: `123`
- Email: `newuser3@colorado.edu`
- Validation: Password strength requirements

**Expected Results:**
- Registration fails
- Error message displayed: "Password must be at least 8 characters and include uppercase, lowercase, and numbers"
- User remains on registration page
- No user account created
- Client-side and server-side validation both trigger

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 2.5: Failed Registration - Missing Required Fields
**Test Case ID:** TC-REG-005  
**Priority:** High  
**Preconditions:** 
- User is on registration page

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Leave username field empty
3. Enter password: `Password123!`
4. Enter email: `user@colorado.edu`
5. Click "Register" button

**Test Data:**
- Username: `` (empty)
- Password: `Password123!`
- Email: `user@colorado.edu`

**Expected Results:**
- Registration fails
- HTML5 validation triggers: "Please fill out this field"
- Form does not submit
- No server request made
- User remains on registration page

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 2.6: Failed Registration - Email Already Registered
**Test Case ID:** TC-REG-006  
**Priority:** High  
**Preconditions:** 
- Email `user1@colorado.edu` is already registered

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Enter username: `newuser4`
3. Enter password: `Password123!`
4. Enter email: `user1@colorado.edu` (already registered)
5. Click "Register" button

**Test Data:**
- Username: `newuser4`
- Password: `Password123!`
- Email: `user1@colorado.edu` (duplicate)
- Database Check: Email uniqueness validation

**Expected Results:**
- Registration fails
- Error message displayed: "This email is already registered. Please login instead."
- User remains on registration page
- Link to login page provided
- No duplicate account created

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 2.7: Successful Registration for Comparison
**Test Case ID:** TC-REG-007  
**Priority:** High  
**Preconditions:** 
- User is on registration page
- Username and email are unique

**Test Steps:**
1. Navigate to http://localhost:3000/register
2. Enter username: `validuser1`
3. Enter password: `Password123!`
4. Enter email: `validuser1@colorado.edu`
5. Click "Register" button

**Test Data:**
- Username: `validuser1`
- Password: `Password123!`
- Email: `validuser1@colorado.edu`
- Role: user (default)

**Expected Results:**
- Registration succeeds
- User account created in database
- User is redirected to login page or auto-logged in
- Success message displayed: "Registration successful! Welcome to Rundown."
- Email verification sent (if implemented)
- User assigned to CU Boulder college instance

**Actual Results:**
_To be filled after test execution_

---

### Test Environment
- **Platform:** localhost (transitioning to cloud)
- **URL:** http://localhost:3000/register
- **Server:** Node.js with Express.js
- **Database:** PostgreSQL (future) / Mock database (current)
- **Email Verification API:** 
  - Abstract API Email Validation
  - Endpoint: https://emailvalidation.abstractapi.com/v1/
  - Purpose: Verify email is real and deliverable
- **School Domain Validation:** 
  - Check for @colorado.edu domain
  - Future: Support multiple universities
- **Password Hashing:** bcrypt (to be implemented)
- **Frontend Validation:** HTML5 + JavaScript
- **Backend Validation:** Express validators

### Test Data Summary
```javascript
// Valid Test Registration Data
const validTestData = {
  username: 'validuser1',
  password: 'Password123!',
  email: 'validuser1@colorado.edu'
};

// Invalid Test Data Sets
const invalidDataSets = [
  { username: 'newuser1', password: 'Password123!', email: 'notanemail@invalid', error: 'Invalid email format' },
  { username: 'newuser2', password: 'Password123!', email: 'user@gmail.com', error: 'Non-school email' },
  { username: 'user1', password: 'NewPassword123!', email: 'new@colorado.edu', error: 'Duplicate username' },
  { username: 'newuser3', password: '123', email: 'new3@colorado.edu', error: 'Weak password' },
  { username: '', password: 'Password123!', email: 'new4@colorado.edu', error: 'Missing username' },
  { username: 'newuser4', password: 'Password123!', email: 'user1@colorado.edu', error: 'Duplicate email' }
];

// Existing Users to Test Against
const existingUsers = [
  { username: 'user1', email: 'user1@colorado.edu' },
  { username: 'moderator1', email: 'moderator1@colorado.edu' },
  { username: 'admin1', email: 'admin1@colorado.edu' }
];
```

### User Acceptance Testers
- **Tester 1:** Nikhil Pudtha (Backend Developer) - nipu6271@colorado.edu
- **Tester 2:** Dhilon Prasad (Full Stack Developer) - dhpr4013@colorado.edu
- **Tester 3:** Alfred Whitemore (Full Stack Developer) - alwh8829@colorado.edu
- **Requirement:** Create fake email addresses and test user profiles
- **Test Email Accounts:** 
  - testuser1@colorado.edu
  - testuser2@colorado.edu
  - testuser3@colorado.edu
- **Method:** Use email forwarding or test email services to receive verification emails

### Success Criteria
- ✅ Invalid email formats are rejected
- ✅ Non-CU Boulder emails are rejected
- ✅ Duplicate usernames are prevented
- ✅ Duplicate emails are prevented
- ✅ Weak passwords are rejected
- ✅ Required fields are enforced
- ✅ API email verification works correctly
- ✅ Appropriate error messages are displayed
- ✅ Valid registrations succeed and create new user in corresponding university college

---

## Test Feature 3: Banned User Access Control

### Feature Description
If a user is banned, they should be prompted with a message and experience restricted access to certain areas. Banned users are restricted by moderators or admins for profane language or cyberbullying.

### Test Scenario
A user has been banned from a specific community or globally by a moderator or admin. The system should display appropriate ban messages and restrict access accordingly.

### Test Cases

#### Test Case 3.1: Community-Specific Ban - Login Attempt
**Test Case ID:** TC-BAN-001  
**Priority:** High  
**Preconditions:** 
- User is banned from "Housing" community by moderator
- User has valid credentials
- Ban reason: Profane language

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter username of banned user: `banneduser1`
3. Enter password: `Banned123!`
4. Click "Login" button
5. Attempt to access Housing community

**Test Data:**
- Username: `banneduser1`
- Password: `Banned123!`
- Banned From: Housing community
- Ban Reason: "Profane language detected in Housing discussions"
- Banned By: moderator1 (Jane Smith)
- Ban Date: November 15, 2025
- Ban Duration: 7 days

**Expected Results:**
- User can login successfully
- User is redirected to home page
- Banner notification displayed: "You have been banned from Housing community until November 22, 2025. Reason: Profane language detected in Housing discussions."
- User can access other communities normally
- Housing community link is disabled/grayed out
- Attempting to access /communities/housing shows ban message page
- No missing page components
- Full navigation and profile visible

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.2: Global Ban - Login Blocked
**Test Case ID:** TC-BAN-002  
**Priority:** Critical  
**Preconditions:** 
- User is globally banned by admin
- User has valid credentials
- Ban reason: Cyberbullying

**Test Steps:**
1. Navigate to http://localhost:3000/login
2. Enter username of globally banned user: `banneduser2`
3. Enter password: `Banned456!`
4. Click "Login" button

**Test Data:**
- Username: `banneduser2`
- Password: `Banned456!`
- Banned: Globally (all communities)
- Ban Reason: "Repeated cyberbullying violations across multiple communities"
- Banned By: admin1 (Admin User)
- Ban Date: November 10, 2025
- Ban Duration: Permanent

**Expected Results:**
- Login is blocked
- Error message displayed: "Your account has been permanently banned. Reason: Repeated cyberbullying violations across multiple communities. Contact admin@rundown.colorado.edu to appeal."
- User cannot access any part of the application
- Session is not created
- Appeal contact information is provided
- No missing UI components on error page

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.3: Banned User - Post Creation Blocked
**Test Case ID:** TC-BAN-003  
**Priority:** High  
**Preconditions:** 
- User is logged in
- User is banned from "Lost & Found" community
- User attempts to create post

**Test Steps:**
1. Login as banned user: `banneduser3`
2. Navigate to Lost & Found community
3. Attempt to click "Create Post" button
4. Try to submit a post

**Test Data:**
- Username: `banneduser3`
- Password: `Banned789!`
- Banned From: Lost & Found community
- Ban Reason: "Spam posting"
- Banned By: moderator2
- Ban Duration: 14 days

**Expected Results:**
- "Create Post" button is disabled or hidden in banned community
- If button is clicked, modal displays: "You are banned from posting in Lost & Found until [date]. Reason: Spam posting."
- User can view posts but cannot create, edit, or delete
- User can still create posts in non-banned communities
- No functionality errors or missing components

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.4: Banned User - Comment Restriction
**Test Case ID:** TC-BAN-004  
**Priority:** High  
**Preconditions:** 
- User is logged in
- User is banned from commenting in "Clubs" community

**Test Steps:**
1. Login as banned user: `banneduser4`
2. Navigate to any post in Clubs community
3. Attempt to add a comment
4. Try to reply to existing comments

**Test Data:**
- Username: `banneduser4`
- Password: `Banned012!`
- Banned From: Clubs community (comment ban only)
- Ban Reason: "Harassment in comments"
- Ban Type: Comment restriction (can view and post, but not comment)
- Banned By: moderator3
- Ban Duration: 30 days

**Expected Results:**
- Comment box is disabled in Clubs community
- Tooltip message: "You are restricted from commenting. Reason: Harassment in comments."
- User can still view all posts and comments
- User can create new posts but not comment
- Reply buttons are disabled
- Clear visual indication of comment restriction
- User can comment normally in other communities

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.5: Profanity Detection - Automatic Ban Trigger
**Test Case ID:** TC-BAN-005  
**Priority:** High  
**Preconditions:** 
- User is logged in and active
- Profanity filter is enabled
- User has 2 previous warnings

**Test Steps:**
1. Login as user: `testuser5`
2. Navigate to any community
3. Create post with profane content: "This is [profanity] content"
4. Submit post

**Test Data:**
- Username: `testuser5`
- Post Content: Contains profanity from blacklist
- Previous Warnings: 2
- Community: Housing
- Detection Method: Automated profanity filter

**Expected Results:**
- Post is not published
- User receives immediate ban notification: "You have been automatically banned from Housing for 3 days due to profane language. This is your third violation."
- Ban record is created in database
- Moderator is notified of automatic ban
- User's access to Housing is immediately restricted
- No post appears in community feed
- System logs the incident

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.6: Ban Expiration - Automatic Reinstatement
**Test Case ID:** TC-BAN-006  
**Priority:** Medium  
**Preconditions:** 
- User has temporary ban that expires during test
- Current date/time is past ban expiration

**Test Steps:**
1. Set system time to ban expiration date + 1 minute
2. Login as previously banned user: `banneduser1`
3. Attempt to access previously banned community
4. Try to create post in that community

**Test Data:**
- Username: `banneduser1`
- Ban Duration: 7 days (expired)
- Ban End Date: November 22, 2025 (passed)
- Current Test Date: November 23, 2025
- Community: Housing

**Expected Results:**
- User can login successfully
- No ban notification is displayed
- User has full access to Housing community
- User can create posts and comments
- Ban record in database shows status: "expired"
- User's permissions are fully restored
- Success message: "Your ban has been lifted. Please follow community guidelines."

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.7: Ban Appeal Process
**Test Case ID:** TC-BAN-007  
**Priority:** Medium  
**Preconditions:** 
- User is banned
- Appeal system is implemented

**Test Steps:**
1. Login as banned user (or view ban message)
2. Click "Appeal Ban" button
3. Fill out appeal form with reason
4. Submit appeal
5. Admin reviews appeal

**Test Data:**
- Username: `banneduser2`
- Ban Type: Community-specific
- Appeal Reason: "I believe this was a misunderstanding. My comment was taken out of context."
- Appeal Date: November 18, 2025

**Expected Results:**
- Appeal form is accessible to banned users
- Appeal is submitted to moderator/admin queue
- User receives confirmation: "Your appeal has been submitted. You will receive a response within 48 hours."
- Moderator/admin can review appeal in dashboard
- If approved, ban is lifted immediately
- User receives email notification of appeal decision
- All functionality works without errors

**Actual Results:**
_To be filled after test execution_

---

#### Test Case 3.8: Multiple Ban Statuses - UI Display
**Test Case ID:** TC-BAN-008  
**Priority:** Medium  
**Preconditions:** 
- User is banned from multiple communities simultaneously

**Test Steps:**
1. Login as user: `banneduser6`
2. View profile/dashboard
3. Navigate to different communities
4. Check notification area

**Test Data:**
- Username: `banneduser6`
- Banned From: 
  - Housing (7 days remaining)
  - Lost & Found (14 days remaining)
  - Clubs (3 days remaining)
- Banned By: Multiple moderators
- Ban Reasons: Various violations

**Expected Results:**
- Dashboard displays all active bans in organized list
- Each ban shows: community name, reason, duration remaining, banned by
- Community links are appropriately disabled
- No UI overlap or display issues
- Color-coded ban severity (yellow=temporary, red=permanent)
- Countdown timers for temporary bans
- All page components render correctly
- No missing information

**Actual Results:**
_To be filled after test execution_

---

### Test Environment
- **Platform:** localhost (future: cloud deployment)
- **URL:** http://localhost:3000
- **Database:** PostgreSQL
  - Tables: users, bans, communities, posts, profanity_filter
  - Ban table fields: ban_id, user_id, community_id, reason, banned_by, ban_start, ban_end, ban_type, is_active
- **Profanity Detection:** 
  - Library: bad-words-filter or custom implementation
  - Blacklist maintained by admins
  - Severity levels: warning, temporary ban, permanent ban
- **Notification System:** Real-time alerts via WebSockets (future) or page load checks (current)
- **Ban Management Dashboard:** Admin/Moderator interface
- **Logging:** All ban actions logged with timestamp and admin/moderator ID

### Test Data Summary

```javascript
// Banned Test Users
const bannedUsers = [
  {
    username: 'banneduser1',
    password: 'Banned123!',
    email: 'banned1@colorado.edu',
    banned_from: ['Housing'],
    ban_reason: 'Profane language detected in Housing discussions',
    banned_by: 'moderator1',
    ban_start: '2025-11-15',
    ban_end: '2025-11-22',
    ban_type: 'community',
    is_active: true
  },
  {
    username: 'banneduser2',
    password: 'Banned456!',
    email: 'banned2@colorado.edu',
    banned_from: ['all'],
    ban_reason: 'Repeated cyberbullying violations across multiple communities',
    banned_by: 'admin1',
    ban_start: '2025-11-10',
    ban_end: 'permanent',
    ban_type: 'global',
    is_active: true
  },
  {
    username: 'banneduser3',
    password: 'Banned789!',
    email: 'banned3@colorado.edu',
    banned_from: ['Lost & Found'],
    ban_reason: 'Spam posting',
    banned_by: 'moderator2',
    ban_start: '2025-11-12',
    ban_end: '2025-11-26',
    ban_type: 'post_restriction',
    is_active: true
  },
  {
    username: 'banneduser4',
    password: 'Banned012!',
    email: 'banned4@colorado.edu',
    banned_from: ['Clubs'],
    ban_reason: 'Harassment in comments',
    banned_by: 'moderator3',
    ban_start: '2025-11-05',
    ban_end: '2025-12-05',
    ban_type: 'comment_restriction',
    is_active: true
  },
  {
    username: 'banneduser6',
    password: 'Banned345!',
    email: 'banned6@colorado.edu',
    banned_from: ['Housing', 'Lost & Found', 'Clubs'],
    ban_reason: 'Multiple violations',
    banned_by: 'admin1',
    ban_type: 'community',
    is_active: true
  }
];

// Profanity Test Data
const profanityTestCases = [
  { text: 'This is a normal post', should_flag: false },
  { text: 'This contains [profanity]', should_flag: true },
  { text: 'Disguised pr0fanity', should_flag: true },
  { text: 'Multiple [bad] [words] here', should_flag: true }
];

// Admin/Moderator Accounts for Ban Testing
const testAdmins = [
  { username: 'admin1', role: 'admin', can_ban: 'global' },
  { username: 'moderator1', role: 'moderator', can_ban: 'Housing' },
  { username: 'moderator2', role: 'moderator', can_ban: 'Lost & Found' },
  { username: 'moderator3', role: 'moderator', can_ban: 'Clubs' }
];
```

### User Acceptance Testers
- **Tester 1:** Matvey Bubalo (Full Stack Developer) - mabu6218@colorado.edu
  - Role: Test admin ban functionality
- **Tester 2:** Ryan Murray (Backend Developer) - rymu8585@colorado.edu
  - Role: Test database ban records and queries
- **Tester 3:** Dhilon Prasad (Full Stack Developer) - dhpr4013@colorado.edu
  - Role: Test moderator ban functionality
- **Tester 4:** RJ Wiebe (Frontend Developer) - rowi2520@colorado.edu
  - Role: Test UI/UX of ban messages and restrictions
- **Test Accounts:** Multiple fake banned user profiles created specifically for testing
- **Ban Test Communities:** Housing, Lost & Found, Clubs, Classes

### Success Criteria
- ✅ Banned users receive appropriate notification messages
- ✅ Community-specific bans restrict access to only banned communities
- ✅ Global bans prevent all application access
- ✅ Profanity detection automatically triggers bans
- ✅ Ban expiration automatically reinstates users
- ✅ No missing UI components when ban messages are displayed
- ✅ Ban records are properly stored in database
- ✅ Moderators can only ban in their communities
- ✅ Admins can ban globally
- ✅ Appeal process works correctly
- ✅ Multiple ban statuses display properly

---

## Test Execution Summary

### Test Schedule
- **Start Date:** November 18, 2025
- **End Date:** November 25, 2025
- **Test Phases:**
  - Phase 1: Login functionality (Nov 18-19)
  - Phase 2: Registration validation (Nov 20-21)
  - Phase 3: Ban system (Nov 22-24)
  - Phase 4: Regression testing (Nov 25)

### Test Metrics to Track
- Total test cases: 22
- Test cases passed: _TBD_
- Test cases failed: _TBD_
- Test cases blocked: _TBD_
- Pass rate: _TBD_
- Defects found: _TBD_
- Defects fixed: _TBD_

### Test Sign-Off
- **Test Lead:** RJ Wiebe
- **Approval Required From:** 
  - Project Manager: Matvey Bubalo
  - Backend Lead: Ryan Murray
  - Frontend Lead: Baden Miles

---

## Appendix

### Defect Tracking Template
```
Defect ID: DEF-XXX
Title: [Brief description]
Severity: Critical | High | Medium | Low
Test Case: TC-XXX-XXX
Steps to Reproduce:
1. ...
2. ...
Expected Result: ...
Actual Result: ...
Screenshots: [Attach if applicable]
Assigned To: [Developer name]
Status: Open | In Progress | Fixed | Closed
```

### Notes
- All test cases should be executed on localhost before cloud deployment
- Password hashing with bcrypt will be implemented before production
- Email verification API integration pending for registration
- Ban system profanity filter requires blacklist maintenance
- Future testing will include performance and security penetration tests

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Next Review Date:** December 1, 2025  
**Prepared By:** RJ Wiebe - Frontend Developer
