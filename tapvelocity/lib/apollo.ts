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

const hostFromExpo =
  Constants.expoConfig?.hostUri?.split(':')[0] ||
  (Constants as any).manifest2?.extra?.expoGo?.debuggerHost?.split(':')[0];

const fallbackHost = Platform.select({
  android: '10.0.2.2', // Android emulator
  default: 'localhost',
});

const backendHost = hostFromExpo ?? fallbackHost;

const httpUri =
  process.env.EXPO_PUBLIC_GRAPHQL_HTTP_URL ?? `http://${backendHost}:4000/graphql`;

const wsUri =
  process.env.EXPO_PUBLIC_GRAPHQL_WS_URL ?? `ws://${backendHost}:4000/graphql`;

const httpLink = new HttpLink({ uri: httpUri });

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
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
