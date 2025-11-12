-- Main Tables
CREATE TABLE colleges ( --users references this so it needs to get created first
    college_id SERIAL PRIMARY KEY,
    college_name VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    domain VARCHAR(100),
    logo VARCHAR(100), --URL of the college logo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--Required for registration are username, email, and password
CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
    profile_picture VARCHAR(100), --URL of a user's profile picture
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    college_id INT,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
);

CREATE TABLE posts(
	post_id SERIAL PRIMARY KEY,
    text VARCHAR (500),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE communities(
    community_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    description VARCHAR(500),
    community_type VARCHAR(60), --type is a non-reserved keyword but it's still best to avoid using it as an identifier
    created_by INT, --user_id of the creator
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    number_of_members INT DEFAULT 0 CHECK (number_of_members >= 0),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);


-- Connection Tables
CREATE TABLE users_communities(
    user_id INT,
    community_id INT,
    PRIMARY KEY (user_id, community_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(community_id) ON DELETE CASCADE
);

CREATE TABLE post_likes(
    user_id INT,
    post_id INT,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
);

CREATE TABLE verification_tokens(
    token VARCHAR(100) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
);


--Default Sample Data
--colleges data
INSERT INTO colleges(college_name, location, domain)
VALUES
('University of Colorado Boulder','Boulder, CO','colorado.edu'),
('University of Colorado Colorado Springs','Colorado Springs, CO','uccs.edu'),
('Colorado State University','Fort Collins, CO','colostate.edu');
--users data
INSERT INTO users(first_name, last_name, username, password, email, role, college_id)
VALUES
('Matvey','Bubalo', 'MatveyBu', 'hashed_pw1','matvey.bubalo@colorado.edu','admin',1),
('Liam','Clinton','licl','hashed_pw2','liam.clinton@uccs.edu','member',2),
('Sofia','Reed','soree','hashed_pw3','sofia.reed@colostate.edu','moderator',3);
--community data
INSERT INTO communities(name, description,community_type,created_by, number_of_members)
VALUES
('Gaming Club','Community of students interested in video gaming', 'social', 1,1),
('Sustainability Club','A place for students interested in sustainability to connect','social',2,0),
('Homework Help','Join a community striving for academic success through collaboration!','academic',3,0);
--users_communities connection test
INSERT INTO users_communities(user_id, community_id)
VALUES
(1,1); --Matvey to the Gaming Club