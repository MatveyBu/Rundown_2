CREATE TABLE users (
	user_id INT PRIMARY KEY,
    first_name VARCHAR(60),
    last_name VARCHAR(60),
    username VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    university VARCHAR(100)
);

CREATE TABLE posts(
	post_id INT PRIMARY KEY,
    text VARCHAR (500),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE communities(
    community_id INT PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    description VARCHAR(500),
    type VARCHAR(60),
    number_of_members INT
);

CREATE TABLE users_communities(
    user_id INT,
    community_id INT,
    PRIMARY KEY (user_id, community_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(community_id) ON DELETE CASCADE
);