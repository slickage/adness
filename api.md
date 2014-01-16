# API Documentation for Adness

### Endpoints

#### Auctions
Auctions have a start/end time, public/private, enabled/disabled flags that represent a vehicle for the set of bids from the community. 
##### Fields:
* description (text)
* start (datetime)
* end (datetime)
* public (bool)
* enabled (bool) - Emergency stop would set this to false. 

Private auctions possible.

##### Methods

* GET /api/auctions List of auctions
* PUT /api/auctions/:auction_id Edit metadata for the auction (Moderator)
* POST /api/auctions New auction
* GET /api/auctions/:auction_id Show auction
* GET /api/auctions/:auction_id/emergency_stop Stop auction with reason in param
* DELETE /api/auction/

#### Bids
##### Fields
* auction_id
* slots
* btc_per_slot
* user_id
* timestamp

###### Methods

* GET /api/bids?auction_id=:auction_id Bids for the auction_id
* POST /api/bids Each bid has a auction_id associated, auction also needs to be open, or else it's rejected
* GET /api/bids/my_latest Show current user's latest bid
* DELETE /api/bids/:bid_id Delete individual bid (admin/moderation)

#### Ads

#### Authentication

Based on querying PHP based JSON endpoint that will return the current user's profile in JSON format.