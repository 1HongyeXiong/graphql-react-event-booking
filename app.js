const express = require('express');
const bodyParser = require('body-parser');
const  graphqlHttp   = require('express-graphql').graphqlHTTP;
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event')




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

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!

        }


        type RootQuery {
            events: [Event!]!

        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event

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
            // const event = {
            //     _id: Math.random().toString(),
            //     title: args.eventInput.title,
            //     description: args.eventInput.description,
            //     price: +args.eventInput.price,
            //     date: args.eventInput.date
            // };
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date)

            });
            return event.save().then(result => {
                console.log(result);
                return { ...result._doc }
            }).catch(err => {
                console.log(err);
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