const express = require('express');
const bodyParser = require('body-parser');
const  graphqlHttp   = require('express-graphql').graphqlHTTP;
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const Event = require('./models/event')
const User = require('./models/user')


const app = express()


app.use(bodyParser.json());

// app.get('/',(req, res, next) => {
//     res.send('hello world');
// })

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!

        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!

        }

        input UserInput {
            email: String!
            password: String!
        }


        type RootQuery {
            events: [Event!]!

        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User

        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find().then(events => {
                return events.map(event => {
                    return { ...event._doc, _id: event._doc._id.toString()};
                });
            }).catch(err => {
                throw err;
            });
        },
        createEvent: args => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: 'uvusdjyvgjyvkyvk'

            });
            let createEvent;
            return event.save().then(result => {
                createEvent = { ...result._doc, _id: result._doc._id.toString()};
                return UserfindById('uvusdjyvgjyvkyvk');
               
            }).then(user => {
                if (!user) {
                    throw new Error('User not found');
                }
                user.createEvent.push(event);
                return user.save();
            }).then(result => {
                return createEvent

            }).catch(err => {
                console.log(err);
                throw err;
            });
            
        },
        createUser: args => {
            User,findOne({email: args.userInput.email})
            .then(user => {
                if (user) {
                    throw new Error('User exists already');
                }
                return bcrypt.hash(args.userInput.password, 12);
            })
            .then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });
                return user.save();
            })
            .then(result => {
                return { ...result._doc, password: null,   _id:result.id}
            }).catch(err => {
                throw err;
            });
            
        }
    },
    graphiql:true
}) );


// Database connection
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@graphql-jerry-wfbgv.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
mongoose.connect(URI, { useNewUrlParser: true });
mongoose.connection.once('open', () => {
    console.log(`Connected to Mongo DB:${process.env.MONGO_DB}`);
});




app.listen(3005);