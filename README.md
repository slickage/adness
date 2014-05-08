# Adness

Real-time ad auction system.

[![Build Status](https://travis-ci.org/slickage/adness.svg?branch=master)](https://travis-ci.org/slickage/adness)


# Dependencies

### External dependencies
Install these dependencies as per your OS:

* [Node & npm](http://nodejs.org/)
* [CouchDB](http://couchdb.apache.org/)
* [Redis](http://redis.io/)
* [Baron](http://github.com/slickage/baron)
* External Authentication (passport.js/MySQL)
* (optional) SMTP Mailer - host, port, user, pass


# Configuration
```
  port: process.env.PORT || 8080,  
  admins: parseAdmins(process.env.ADMINS) || ['012345'],  
  sbPrefix: '/sb',
  senderEmail: process.env.SENDER_EMAIL || 'no-reply@test.co',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  secret: 'secret string for adness 1234!',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'smf'
  },
  couchdb: {
    url: 'http://localhost:5984',
    name: 'adness'
  },
  baron: {
    url: process.env.BARON_URL || 'http://localhost:5000',
    internalUrl: process.env.BARON_INTERNAL_URL || 'http://localhost:5000',
    key: process.env.BARON_API_KEY || ''
  },
  admin: {
    email: process.env.ADMIN_EMAILS || ['admin@bitcointalk.org']
  },
  site: {
    url: process.env.SITE_URL || 'http://localhost:8080'
  },
  bitcoin: {
    numebrOfConfs: process.env.CONFS || 2
  }
```
* port: The port to run this server on
* admins: The list of administrators by user ids
* sbPrefix: the prefix for noscript pages (currently the only view available)
* senderEmail: The email that will show up in the from field for all outgoing emails
* redis: The Redis DB that holds user sessions
* secret: it's a secret (to hash the user session)
* mysql: The MySQL DB to grab users from
* couchdb: The DB store for our objects
* baron: The payment processor's URL (internal/external) and API Key
* admin: The administrators emails for registration and payment notification
* site: The URL of this server
* bitcoin: The number of confirmations before a payment is considered paid


# Installation
* Install this software by downloading the master branch from GitHub. 
* run 'npm install' to install dependencies
* run 'node index.js'  

Included is a Procfile to run this application from foreman. Also there's a dockerfile to bring up this application through docker. Use these files at your own discretion.
    
   
# Views and Routes
Views and routes may be specific to whether a user is logged in or not. Some of these views are not accessable if the user is not signed in and will be redirected to the index page.


## Public

#### Views
```
/sb - index route
/sb/rules - Auction Rules
/sb/history - Auction History
/sb/qr/:qrString - QR code generator
```

## Auction

#### Views
```
/sb/auctions/:auctionId - view a specific auction
```

#### POST Routes
```
/sb/auctions/enable/:auctionId - enable a specific auction (Admin access only)
/sb/auctions/disable/:auctionId - disable a specific auction (Admin access only)
/sb/auctions/edit - Edit a specific auction (Admin access only)
/sb/auctions/ - Create a new auction (Admin access only)
```

#### DELETE Routes
```
/sb/auctions/:auctionId - delete a specific auction
```

## Bids

#### POST Routes
```
/sb/bids/ - create a new bid 
/sb/bids/edit - edit a bid (Admin access only)
```

#### DELETE Routes
```
/sb/bids/:bidId - delete a bid
```

## Ads

#### Views
```
/sb/uses/:userId - All ads for a specific user
/sb/ads/upload - Ad Creation view
/sb/ads/random?ip=192.168.1.1&limit=12 - Retrieve a random ad from the last auction
/sb/ads/:adId/edit - Ad Edit view (same as Ad Creation view but preloaded with specific Ad info)
/sb/ads/:adId - view a specific ad
```

#### POST Routes
```
/sb/ads/:adId/approve - approve a user's ad (admin access only)
/sb/ads/:adId/reject - reject a user's ad (admin access only)
/sb/ads/:adId/delete - delete a user's ad
/sb/ads/:adId/inRotation - add a user's ad to the auction's list of ads (for winners only)
/sb/ads/:adId/outRotation - remove a user's ad from the auction's list of ads (for winners only)
/sb/ads/:adId - update an ad
/sb/ads/ - create a new ad
```

#### DELETE Routes
```
/sb/ads/:adId - delete a user's ad

```

## Admin

#### Views
```
/admin/ads/submitted - view all submitted ads from all users (admin access only)
/admin/auctions/edit/:auctionId - edit a user's auction (admin access only)
/admin - CMS page for auctions (admin access only)
```



# Object Documentation

## Auctions
Auctions have a start/end/trueEnd time, number of ad slots, and an enabled flag that represent a vehicle for the set of bids from the community.

```
start (datetime)
end (datetime)
trueEnd (datetime)
slots (number)
enabled (bool)
```
##### Times
The start/end/trueEnd times is the period in which an auction is exposed to the public and bidding can take place. The end time is a general close of auction time at which point the auction could close at any point up to 30 minutes after this stated time. The trueEnd time is the actual time the auction will close but is hidden away from user to prevent auction sniping.

##### Slots
The slots property indicates the number of slots available for this auction. 

##### Enabled
This property indicates whether the auction should be displayed to the public regardless of auction start/end/trueEnd times. This is so the admin has a fail safe way to stop an auction 
if needed. 

#### Mutability of an Auction
As an auction opens and bidding takes place, the auction object itself is modified through the bidding algorithm. Each time an auction is viewed after a bid is placed, the algorithm determines two things, the current set of bid that are considered "winning" and the particular bids that fill the number of slots listed in this auction. 

For example, if an auction has 8 slots and two bids are made for 0.5 BTC for 4 slots each. Then the algorithm will calculate and modify the auction to contain a list of the two bids as winning bids, and a array of slots with a total of 8 items in the array. Four of those items will come from the first bidder and the other 4 will come from the other bidder. 


## Bids
Bids belong to a particular auction and can only be placed in auctions that are open.

```
created_at (datetime)
price (number)
slots (number)
user (object)
auctionId (id)
```

A bid stores the user that placed the bid, the price they are willing to pay for each of their slots and the number of slots they want to bid on. The auctionId property ties the bid to a particular auction. 

## Ads
Each user can create ads and store them on the site. These ads are used after the user has won a slot, or many slots in the auction. A single ad can be in many different states: saved, submitted, approved, rejected, and in rotation.   

```
html (string)  
username (string)  
userId (number)  
blacklistedCN (array of strings)  
created_at (datetime)  
modified_at (datetime)  
approved (boolean)  
submitted (boolean)  
inRotation (boolean)  
```  

HTML is stripped for any malicious content using Google Caja. User's name and ID are taken down to provide ownership of the ad. BlacklistedCN is an array of countries where this ad should not be shown (currently only US and CN are supported). Approved, submitted, and inRotation are all booleans that describe the state in which this ad is considered to be in. If all boolean flags are set to false, the ad is assumed to be in a saved state. The Approved boolean flag can only be set by an admin. 


# API 
There are additional API routes that are exposed but will be covered in a wiki page at a later point in time.

# Authentication

Based on querying PHP based JSON endpoint that will return the current user's profile in JSON format.

# License

MIT
