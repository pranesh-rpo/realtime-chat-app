const bcrypt = require('bcryptjs');
const db = require('./db');

const saltRounds = 10;

function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function registerUser(username, email, password) {
  return new Promise((resolve, reject) => {
    hashPassword(password).then(hashedPassword => {
      db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hashedPassword], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email });
        }
      });
    }).catch(reject);
  });
}

function authenticateUser(email, password) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) {
        reject(err);
      } else if (!user) {
        resolve(null);
      } else {
        comparePassword(password, user.password).then(isValid => {
          if (isValid) {
            resolve({ id: user.id, username: user.username, email: user.email });
          } else {
            resolve(null);
          }
        }).catch(reject);
      }
    });
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await authenticateUser(email, password);
    if (user) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.email = user.email;
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

async function signup(req, res) {
  const { username, email, password } = req.body;

  try {
    const user = await registerUser(username, email, password);
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.email = user.email;
    res.json({ success: true, user });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ success: false, message: 'Username or email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Logout failed' });
    } else {
      res.json({ success: true, message: 'Logged out' });
    }
  });
}

module.exports = {
  registerUser,
  authenticateUser,
  login,
  signup,
  logout
};
