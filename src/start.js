import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors'
import {prepare} from "../utill/index"


const app = express()

app.use(cors())

const homePath = '/graphiql'
const URL = 'http://localhost'
const PORT = 3001
const MONGO_URL = 'mongodb://localhost:27017/blog'



export const start = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL)

    const TestBedGroups = db.collection('testbedgroups');
    const TestBed = db.collection('comments');
    const TestOrder = db.collection('testorder');
    const Recipe = db.collection('recipe');

    const typeDefs = [`
      type Query {
        testbed(_id: String): TestBed
        testbeds: [TestBed]
        testbedgroup(_id: String): TestBedGroups
        testbedgroups: [TestBedGroups]
        testorder(_id: String): TestOrder
        testorders: [TestOrder]
        recipe(_id: String): Recipe 
        recipes: [Recipe]
      }

      type TestBedGroups {
        _id: String
        name: String
        description: String
        testbeds: [TestBed]
      }

      type TestBed {
        _id: String
        name: String
        description: String
        testorders: [TestOrder]
      }
      
      type TestOrder {
          _id: String
          name: String
          description: String
          testbeds: [TestBed]
          recipes: [Recipe]
      }
      
      type Recipe {
          _id: String
          name: String
          description: String
    }
      

      type Mutation {
        createTestBedGroups(_id: String,
        name: String,
        description: String,
        testbeds: [TestBed]): TestBedGroup
        
        createTestBed(_id: String,
        name: String,
        description: String,
        testorders: [TestOrder]): TestBed
        
        createTestOrder(_id: String,
          name: String,
          description: String,
          testbeds: [TestBed],
          recipes: [Recipe]): TestOrder
        
        createTestRecipe(_id: String,
          name: String,
          description: String)
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        post: async (root, {_id}) => {
          return prepare(await Posts.findOne(ObjectId(_id)))
        },
        posts: async () => {
          return (await Posts.find({}).toArray()).map(prepare)
        },
        comment: async (root, {_id}) => {
          return prepare(await Comments.findOne(ObjectId(_id)))
        },
      },
      Post: {
        comments: async ({_id}) => {
          return (await Comments.find({postId: _id}).toArray()).map(prepare)
        }
      },
      Comment: {
        post: async ({postId}) => {
          return prepare(await Posts.findOne(ObjectId(postId)))
        }
      },
      Mutation: {
        createPost: async (root, args, context, info) => {
          const res = await Posts.insert(args)
          return prepare(await Posts.findOne({_id: res.insertedIds[1]}))
        },
        createComment: async (root, args) => {
          const res = await Comments.insert(args)
          return prepare(await Comments.findOne({_id: res.insertedIds[1]}))
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })


    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))


    app.use(homePath, graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
