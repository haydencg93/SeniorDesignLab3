const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const path = require('path');
// Load .env from the supabase folder
require('dotenv').config({ path: path.resolve(__dirname, '../supabase/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY || !SUPABASE_URL) {
    console.error("Error: Could not find SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    console.log("Ensure your .env file is at: " + path.resolve(__dirname, 'supabase/.env'));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/**
 * Requirement #3: Offline mechanism to change/add passwords.
 * Hashes the plain text password and inserts it into the 'passwords' table.
 */
async function updatePassword(plainPassword) {
    try {
        console.log(`Hashing password: "${plainPassword}"...`);
        const saltRounds = 10;
        const hashed = await bcrypt.hash(plainPassword, saltRounds);

        // Check for duplicates to avoid unique constraint errors
        const { data: existing } = await supabase
            .from('passwords')
            .select('hashed_passwd')
            .eq('hashed_passwd', hashed);

        if (existing && existing.length > 0) {
            console.log("This password hash already exists in the database.");
            return;
        }

        // Insert new hash into the 'passwords' table
        const { error } = await supabase
            .from('passwords')
            .insert([{ hashed_passwd: hashed }]);

        if (error) {
            console.error("Error updating database:", error.message);
        } else {
            console.log("Success! New password hash added to the database.");
        }
    } catch (err) {
        console.error("Script failed:", err.message);
    }
}

// Run the function with the default lab password
// You can change this string and re-run the script to add new passwords
updatePassword("Spring2026Lab3");