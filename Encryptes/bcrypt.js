const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // salt work cost


const createUserHash = async(userPassword) => {
    //const userPassword = "MySecretPass123";
    // create the user hash
    const userHash = await bcrypt.hash(userPassword, SALT_ROUNDS);
    console.log('hash is: '+userHash)
    return userHash
}

const checkIfThePasswordIsCorrect = async(userPasswordAttemp, userHash) => {
    // returning true or false if both password have the same hash
    return await bcrypt.compare(userPasswordAttemp, userHash)
}


module.exports = {
    createUserHash,
    checkIfThePasswordIsCorrect
}