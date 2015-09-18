# Lag as a Service

Ever needed more lag in your life?

Now you can get all the lag you need at lagaas.com:

Six seconds of lag:

    http://lagaas.com/6000

One second of lag followed by a redirect to google:

    http://lagaas.com/1000/www.google.com
    
    
## Misc

Azure websites don't play well with `:` or even the encoded `%3A` in the path, so 

`lagaas.com/1000/http://www.google.com` 

will not work, because the url contains a `:`, skip the `http://` part and you should be okay.

The file `stats.js` file is about logging some stats to a azure db, just pull it out if you don't need that.

Don't worry about `db_keys.json`, its just for making local testing easier.



