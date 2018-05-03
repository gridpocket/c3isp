#CSV to CEF converter
First clone the reprository and make sure to node installed in your computer. Then in converter folder, use **csvToCef.js** script to convert CSV files given as example into CEF format.
###To run the script
- node csvToCef.js

### Email to JSON
If you want to convert an Email to JSON format
- Add your mail in the Email_Analysis/Email directory
- The file containing your mail must have a .txt extension

Stay on the c3isp directory and Run :

    node Email_Analysis/EmailToJSON.js

- Go to  http://localhost:8080/api-docs

- Select GET /{file} and click on "Try it out"
- Enter your email's filename as a parameter but don't add the '.txt' extension !
- Execute and see the results.

Two type of responses can be sent :

- '200' : The email has been converted
- '404' : The email doesnt exist in the Email directory
