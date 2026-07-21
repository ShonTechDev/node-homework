//export the three given functions register, logon, logoff

// function register(req, res) {
// }

// function logon(req, res) {
// }

// function logoff(req, res) {
// }

// module.exports = {
//   register,
//   logon,
//   logoff,
// };


function register(req, res) {
  // Read name, email, and password from req.body
  const { name, email, password } = req.body;

  // Create a new user object
  const newUser = {
    name,
    email,
    password,
  };

  // Add that user to global.users
  global.users.push(newUser);

  // Set global.user_id to that user
  global.user_id = newUser;

  // Return status 201 with the user's name and email
  res.status(201).json({
    // Do not return the password
    name: newUser.name,
    email: newUser.email,
  });
}

function logon (req, res) {
    //read email and password from req.body
    const { email, password } = req.body;

    // Find a matching user in global.users
    //create variable, matchingUser and equal that to the global.users.find((user){})
    const matchingUser = global.users.find((user) => {
       
        return user.email === email && user.password === password;  
    });
    

    if(!matchingUser) {
     return res.sendStatus(401);        //"res.status(401)" does not finish the response, "res.sendStatus(401);" does
    }

     global.user_id = matchingUser;
     
    return res.status(200).json({ // Return status 200
         // If the email and password match, set global.user_id to that user // Return JSON with the user's name and email
        name: matchingUser.name,
        email: matchingUser.email,
    }); 
}

function logoff (req, res) {
    global.user_id = null;

    return res.sendStatus(200);
}

module.exports = {
    register,
    logon,
    logoff,
};

