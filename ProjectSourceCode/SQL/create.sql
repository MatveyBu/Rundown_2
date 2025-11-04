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
