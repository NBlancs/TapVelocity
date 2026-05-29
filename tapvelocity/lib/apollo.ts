import { ApolloClient, InMemoryCache, HttpLink, split, OperationVariables } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

class AppInMemoryCache extends InMemoryCache {
  override diff<TData, TVariables extends OperationVariables = OperationVariables>(
    options: any
  ) {
    if (options && 'canonizeResults' in options) {
      const { canonizeResults: _deprecated, ...safeOptions } = options;
      return super.diff<TData, TVariables>(safeOptions);
    }

    return super.diff<TData, TVariables>(options);
  }

  override read<T>(options: any) {
    if (options && 'canonizeResults' in options) {
      const { canonizeResults: _deprecated, ...safeOptions } = options;
      return super.read<T>(safeOptions);
    }

    return super.read<T>(options);
  }
}

import { useServerStore } from '@/stores/server-store';

const httpLink = new HttpLink({
  uri: () => {
    return useServerStore.getState().serverUrl;
  },
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: () => {
      return useServerStore.getState().wsUrl;
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new AppInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
