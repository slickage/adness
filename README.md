# Adness

Real-time ad auction system.

[![Gitter chat](https://badges.gitter.im/slickage/adness.png)](https://gitter.im/slickage/adness)
[![Build Status](https://travis-ci.org/slickage/adness.svg?branch=master)](https://travis-ci.org/slickage/adness)


# Dependencies

### External dependencies
Install these dependencies as per your OS:

* [Node & npm](http://nodejs.org/)
* [CouchDB](http://couchdb.apache.org/)
* [Redis](http://redis.io/)
* [Baron](http://github.com/slickage/baron)
* [foreman](https://github.com/ddollar/foreman)
* [nodemon](https://github.com/remy/nodemon) - for development
* External Authentication (passport.js/MySQL)
* (optional) SMTP Mailer - host, port, user, pass

** Before proceeding with Adness' installation ensure that CouchDB is using the ['random' algorithm](http://docs.couchdb.org/en/latest/config/misc.html#uuids/algorithm) instead of the default 'sequential'. This is to prevent easy guessing of id hashes. **

# Configuration
```
  port: process.env.PORT || 8080,  
  admins: parseAdmins(process.env.ADMINS) || ['012345'],  
  sbPrefix: '/sb',
  senderEmail: process.env.SENDER_EMAIL || 'no-reply@test.co',
  antiSnipeMinutes: process.env.ANTISNIPE_MINUTES || 30,
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
    numberOfConfs: process.env.CONFS || 2
  },
  regions: [
    {
      name: 'US',
      countries: ['US'],
      exclusive: false
    },
    {
      name: 'CN',
      countries: ['CN'],
      exclusive: false
    },
    {
      name: 'RU',
      countries: ['RU'],
      exclusive: false
    },
    {
      name: 'Global'
    },
  ],
  rounds: {
    maxRounds: 6,
    round1: { timeOffset: 1000 * 60 * 60 * 24, discount: 0 },
    round2: { timeOffset: 1000 * 60 * 60 * 12, discount: 0.075 },
    round3: { timeOffset: 1000 * 60 * 60 * 6, discount: 0.15 },
    round4: { timeOffset: 1000 * 60 * 60 * 3, discount: 0.30 },
    round5: { timeOffset: 1000 * 60 * 60 * 1.5, discount: 0.60},
    round6: { timeOffset: 1000 * 60 * 60 * 1.5, discount: 0.80 }
  },
  fakeAuth: {
    enabled: parseBool(process.env.FAKEAUTH) || false,
    userId: Number(process.env.FAKEAUTH_USERID) || 1,
    email: process.env.FAKEAUTH_EMAIL || 'user@example.com',
    admin: parseBool(process.env.FAKEAUTH_ADMIN) || true
  },
  debugMode: parseBool(process.env.DEBUG_MODE) || false
```
* port: The port to run this server on
* admins: The list of administrators by user ids
* sbPrefix: the prefix for noscript pages (currently the only view available)
* senderEmail: The email that will show up in the from field for all outgoing emails
* antiSnipeMinutes: The random max length of time added to the end time of an auction
* redis: The Redis DB that holds user sessions
* secret: it's a secret (to hash the user session)
* mysql: The MySQL DB to grab users from
* couchdb: The DB store for our objects
* baron: The payment processor's URL (internal/external) and API Key
* admin: The administrators emails for registration and payment notification
* site: The URL of this server
* bitcoin: The number of confirmations before a payment is considered paid
* regions: The geographical regions that an auction/ad/bid can contain
* rounds: The number of and configurations for each recalculation round
* fakeAuth: bypass SMF Auth with a fake user for easy local testing
* debugMode: enable if you want the noisy, colored express GET/POST messages

**NOTES:**  
* Properties in config.js can be overriden using a [.env](http://ddollar.github.io/foreman/#ENVIRONMENT) file and [foreman](https://github.com/ddollar/foreman).

# Installation
* Install this software by downloading the master branch from GitHub. 
* run 'npm install' to install dependencies
* run 'node index.js'  

Included is a Procfile to run this application from [foreman](https://github.com/ddollar/foreman). Also there's a dockerfile to bring up this application through [docker](https://www.docker.io/). Use these files at your own discretion.

To run adness with foreman:  
In Production:  
```$ foreman start```

In Development:  
```$ foreman start -f Procfile-dev```


# Views and Routes
Views and routes may be specific to whether a user is logged in or not. Some of these views are not accessable if the user is not signed in and will be redirected to the index page.


## Public

#### Views (GET)
```
/sb - Index route
/sb/rules - Auction Rules
/sb/history - Auction History
```

## Auction

#### Views (GET)
```
/sb/auctions/:auctionId - View a specific auction
```

#### POST Routes
```
/sb/auctions/enable/:auctionId - Enable a specific auction (Admin access only)
/sb/auctions/disable/:auctionId - Disable a specific auction (Admin access only)
/sb/auctions/edit - Edit a specific auction (Admin access only)
/sb/auctions/ - Create a new auction (Admin access only)
```

#### DELETE Routes
```
/sb/auctions/:auctionId - Delete a specific auction
```

## Bids

#### POST Routes
```
/sb/bids/ - Create a new bid 
/sb/bids/edit - Edit a bid (Admin access only)
```

#### DELETE Routes
```
/sb/bids/:bidId - Delete a bid
```

## Ads

#### Views (GET)
```
/sb/uses/:userId - All ads for a specific user
/sb/ads/upload - Ad Creation view
/sb/ads/random?ip=192.168.1.1&limit=12 - Retrieve a random ad from the last auction
/sb/ads/:adId/edit - Ad Edit view (same as Ad Creation view but preloaded with specific Ad info)
/sb/ads/:adId - view a specific ad
```

#### POST Routes
```
/sb/ads/:adId/approve - Approve a user's ad (admin access only)
/sb/ads/:adId/reject - Reject a user's ad (admin access only)
/sb/ads/:adId/delete - Delete a user's ad
/sb/ads/:adId/inRotation - Add a user's ad to the auction's list of ads (for winners only)
/sb/ads/:adId/outRotation - Remove a user's ad from the auction's list of ads (for winners only)
/sb/ads/:adId - Update an ad
/sb/ads/ - Create a new ad
```

#### DELETE Routes
```
/sb/ads/:adId - Delete a user's ad

```

## Admin

#### Views
```
/admin/invoices/:auctionId - View all invoices for a particular auction
/admin/invoices - View all closed auctions - used to choose an auction's invoices to view.
/admin/ads/submitted - View all submitted ads from all users (admin access only)
/admin/auctions/edit/:auctionId - Edit a user's auction (admin access only)
/admin/auctions/recalculate/:auctionId - Manually trigger an auction recalculation (Does not invalidate invoices or bids, just auction slot recalculation)
/admin - CMS page for auctions (admin access only)
```



# Object Documentation

## Auctions
Auctions have a start/end/trueEnd time, regions, and an enabled flag that represent a vehicle for the set of bids from the community.

```
start (datetime)
end (datetime)
adsStart (datetime)
adsEnd (datetime)
trueEnd (datetime)
regions (array of strings)
enabled (bool)
description (string)
```
##### Start/End
The start/end/trueEnd datetimes are the boundaries of a period in which an auction is exposed to the public and bidding can take place. The end time is a general close of auction time at which point the auction could close at any point up to 30 minutes after this stated time. The trueEnd time is the actual time the auction will close but is hidden away from user to prevent auction sniping.

##### AdsStart/AdsEnd
The adsStart/adsEnd datetimes are the boundaries of a period in which the ads that have been auctioned are display on the forum. These times must start after the end time of the auction itself. Optimally, the start of the ads period should be at least two days after the end of an auction. This is to allow time for the auction recalculation process to complete in full. 

##### Regions
Each region is a string enumeration that should match one of the values defined in the configs.js file. An auction can have 1 or more regions tied to it and each region will have it own slots and bids.   
A region object is defined as:   
```
name (string)
slots (number)
```

##### Enabled
This property indicates whether the auction should be displayed to the public regardless of auction start/end/trueEnd times. This is so the admin has a fail safe way to stop an auction 
if needed. 

##### Description
An extra text area where the admin can leave some extra information about this particular auction. 

#### Mutability of an Auction
As an auction opens and bidding takes place, the auction object itself is modified through the bidding algorithm. Each time an auction is viewed after a bid is placed, the algorithm determines two things, the current set of bid that are considered "winning" and the particular bids that fill the number of slots listed in this auction. 

For example, if an auction has 8 slots and two bids are made for 0.5 BTC for 4 slots each. Then the algorithm will calculate and modify the auction to contain a list of the two bids as winning bids, and a array of slots with a total of 8 items in the array. Four of those items will come from the first bidder and the other 4 will come from the other bidder. 


## Bids
Bids belong to a particular auction and can only be placed in auctions that are open.

```
created_at (datetime)
price (number)
slots (number)
region (string)
user (object)
auctionId (id)
```

A bid stores the user that placed the bid, the price they are willing to pay for each of their slots and the number of slots they want to bid on. The auctionId property ties the bid to a particular auction. The region property ties this bid to a particular region of auction referenced by the auctionId.

Bids themselves also have a series of states in which they can be in. These states are used by the system to declare whether the bidder has paid for this bid on time or not.  
The list of states for a bid are:  
```
void (bidder has not paid the invoice for this bid on time)
invalid (an admin has manually invalidated this bid)  
wonSlots (the number of bids this bidder has paid for)  
lost (this bid has not won any slot)  
```

The lost state is only assigned at the end of the recalculation process and is applied to only those bids that have not won any slots at any point in time.  

## Ads
Each user can create ads and store them on the site. These ads are used after the user has won a slot, or many slots in the auction. A single ad can be in many different states: saved, submitted, approved, rejected, and in rotation.  
```
html (string)
css (string)
username (string)
userId (number)
region (array of strings)
created_at (datetime)
modified_at (datetime)
approved (boolean)
submitted (boolean)
inRotation (boolean)
```

HTML is stripped for any malicious content using Google Caja. CSS is not sanitize but relies on the admin's best judgement before approving an ad. User's name and ID are taken down to provide ownership of the ad. Regions is an array of countries where this ad should be shown and are string enumerations that are tied into the config.js file. Approved, submitted, and inRotation are all booleans that describe the state in which this ad is considered to be in. If all boolean flags are set to false, the ad is assumed to be in a saved state. The Approved boolean flag can only be set by an admin. 

## Receipts (Invoices)
**This is not a publicly viewable object but is created and maintained on the backend.**  
It basically maintains the state of an invoice sent to user for the ad slots that they have won.  
The format of this object is as follows:  
```
created_at: (datetime)
modified_at: (datetime)
invoice: (invoice object as per Baron)
invoiceStatus: (string)
invoiceType: (string)
metadata: (object)
```

The invoiceStatus defines the current status of the invoice based on webhooks called by Baron. The invoiceType is an internal enumeration that just declares what this invoice is for. This is used to call the proper callback if an invoice is queued for later processing. 

All invoices have the ability to be queued if the system cannot reach Baron. It's saved as a object in the database and a background process continually monitors the "queue" for any invoices that were not processed. 

## Recalculation
**This is not a publicly viewable object but is created and maintained on the backend.**  
After an auction finishes and invoices are sent to all winners, an auction recalculation is schedule as per the variables set in the config.js file. The default settings schedule the recalculations to be fired 24, 12, 6, 3, 1.5, and 1.5 hours after the auction closes, progressively. This should add up to 6 recalculation rounds that all end after around 48 hours from the end of the auction. Each recalculation round also discounts the new winners based on the value set for each round. Each progressive round has a higher and higher discount but can be changed in the configurations. 

During each recalculation, all the invoices sent out are checked for payment. If payment is made, the bids listed in the invoices are updated with their proper states. Having the bids updated, a recalculation of all the auction slots is made, and if there are new winners or previous winners with more slots, new invoices are sent out for those slots. 

Each invoices sent out is set with an expiration time that matches when the length of time before next recalculation is set to begin. 

# API 
There are additional API routes that are exposed but will be covered in a wiki page at a later point in time.

# Authentication

Based on querying PHP based JSON endpoint that will return the current user's profile in JSON format.

# License

MIT
