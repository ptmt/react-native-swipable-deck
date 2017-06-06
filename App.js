/**
 * @flow
 */

import React, { Component } from 'react';
import { StyleSheet, StatusBar, Button, Text, View } from 'react-native';

const CARDS = [
  '#1387FF',
  '#FF9900',
  '#FF0037',
  '#59FF00',
  '#FFC300',
  '#DAF7A6',
  '#FF5733',
  '#C70039',
  '#900C3F',
  '#581845',
];

import DeckViaPanResponder from './DeckViaPanResponder';
import DeckViaInteractable from './DeckViaInteractable';
import InnerCard from './InnerCard';

const ChooseButton = props => (
  <View
    style={{
      backgroundColor: props.deck === props.title ? 'grey' : 'transparent',
    }}>
    <Button
      color="white"
      {...props}
      onPress={() => props.onPress(props.title)}
    />
  </View>
);

export default class SwipableDeck extends Component {
  constructor() {
    super();
    this.state = {
      deck: 'DeckViaPanResponder',
    };
  }
  state: any;
  renderDeck() {
    if (!this.state.deck) {
      return null;
    }
    const Deck = this.state.deck === 'DeckViaInteractable'
      ? DeckViaInteractable
      : DeckViaPanResponder;
    return (
      <Deck
        cards={CARDS.map((c, i) => ({ color: c, key: i }))}
        depth={4}
        renderCard={card => <InnerCard {...card} i={card.key} />}
      />
    );
  }
  render() {
    const { deck } = this.state;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {this.renderDeck()}
        <View style={styles.options}>
          <ChooseButton
            deck={deck}
            title={'DeckViaInteractable'}
            onPress={deck => this.setState({ deck })}
          />

          <ChooseButton
            deck={deck}
            title={'DeckViaPanResponder'}
            onPress={deck => this.setState({ deck })}
          />
        </View>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1B31',
  },
  options: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
  },
});
