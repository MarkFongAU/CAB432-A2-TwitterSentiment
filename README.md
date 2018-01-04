# CAB432-A2-TwitterSentiment
A Twitter Sentiment Analysis application which scales with the number of tweets coming in to the application, built with Express Node back-end and EJS front-end (Sentiment Analysis client).

## Setup and run the Stream server (in an AWS EC2 instance)
Go into the `twitter/stream` folder, install the servers dependencies. Then, install PM2 and startup the node server. This can be done using the following commands:
```shell
$ cd twitter/stream
$ npm install
$ sudo npm install pm2 -g
$ sudo pm2 start npm -- start
$ sudo pm2 startup (allow it to start the npm when an instance starts up)
$ sudo pm2 unstartup (when you need to change some files, enter this first to shut down npm start)
```

## Setup and run the Sentiment Analysis server (in an AWS EC2 instance)
Go into the `twitter/server` folder, install the servers dependencies. Then, install PM2 and startup the node server. This can be done using the following commands:
```shell
$ cd twitter/server
$ npm install
$ sudo npm install pm2 -g
$ sudo pm2 start npm -- start
$ sudo pm2 startup (allow it to start the npm when an instance starts up)
$ sudo pm2 unstartup (when you need to change some files, enter this first to shut down npm start)
```

## Setup and run the Sentiment Analysis client (in an AWS EC2 instance)
```shell
$ cd twitter/app
$ npm install
$ sudo npm install pm2 -g
$ sudo pm2 start npm -- start
$ sudo pm2 startup (allow it to start the npm when an instance starts up)
$ sudo pm2 unstartup (when you need to change some files, enter this first to shut down npm start)
```
Node should start the client at localhost on port 3000 of the EC2 instance
```shell
http://<EC2 instance address>:3000/
```
