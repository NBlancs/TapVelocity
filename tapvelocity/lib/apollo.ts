import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { Platform } from 'react-native';

const uri = Platform.select({
  android: 'http://10.0.2.2:4000/graphql',
  default: 'http://localhost:4000/graphql', // web & iOS
});

const httpLink = new HttpLink({ uri });

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
