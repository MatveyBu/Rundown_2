-- Main Tables
CREATE TABLE colleges ( --users references this so it needs to get created first
    college_id SERIAL PRIMARY KEY,
    college_name VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    domain VARCHAR(100),
    logo VARCHAR(100), --URL of the college logo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
	user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(60),
    last_name VARCHAR(60),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT member CHECK (role IN ('member','moderator','admin')),
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
    created_by INT,
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