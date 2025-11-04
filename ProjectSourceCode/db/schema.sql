CREATE TABLE Colleges (
    college_id INT AUTO_INCREMENT PRIMARY KEY,
    college_name VARCHAR(150) NOT NULL,
    location VARCHAR(150),
    domain VARCHAR(100)
);

CREATE TABLE Communities (
    community_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    college_id INT,
    FOREIGN KEY (college_id) REFERENCES Colleges(college_id)
);