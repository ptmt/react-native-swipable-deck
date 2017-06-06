// @flow

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

import Interactable from 'react-native-interactable';

import clamp from 'clamp';

import { type InnerCardProps } from './InnerCard';

const viewport = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const TRANSITION_STOPS_AT = viewport.width - 100;
const STACK_OFFSET_Y = 35;
const INITIAL_OFFSET_Y = 60;

type Props = {
  cards: Array<InnerCardProps>,
};

export default class extends React.Component {
  cardAnimation: any;
  _panResponder: any;
  lastX: number;
  lastY: number;
  _deltaX: Animated.Value;
  state: {
    pan: Animated.ValueXY,
    cards: Array<InnerCardProps>,
    currentIndex: number,
  };
  constructor(props: Props) {
    super(props);
    this._deltaX = new Animated.Value(0);
    this.state = {
      pan: new Animated.ValueXY(0),
      cards: [].concat(this.props.cards),
      currentIndex: 0,
    };

    this.lastX = 0;
    this.lastY = 0;

    this.cardAnimation = null;

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: (e, gestureState) => {
        this.lastX = gestureState.moveX;
        this.lastY = gestureState.moveY;
        return true;
      },
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        if (Math.abs(gestureState.dx) < Math.abs(gestureState.dy)) return false;
        if (gestureState.dx === 0 && gestureState.dy === 0) return false;
        return (
          Math.abs(this.lastX - gestureState.moveX) > 5 ||
          Math.abs(this.lastY - gestureState.moveY) > 5
        );
      },

      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({
          x: this.state.pan.x._value,
          y: this.state.pan.y._value,
        });
        this.state.pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderTerminationRequest: (evt, gestureState) =>
        this.props.allowGestureTermination,

      onPanResponderMove: Animated.event([
        null,
        { dx: this.state.pan.x, dy: 0 },
      ]),

      onPanResponderRelease: (e, { vx, vy, dx, dy }) => {
        this.state.pan.flattenOffset();
        const velocity = clamp(vx * -1, 5, 9) * -1;

        const hasSwipedHorizontally =
          Math.abs(this.state.pan.x._value) > SWIPE_THRESHOLD;

        if (hasSwipedHorizontally) {
          let cancelled = false;

          const hasMovedRight =
            hasSwipedHorizontally && this.state.pan.x._value > 0;
          const hasMovedLeft =
            hasSwipedHorizontally && this.state.pan.x._value < 0;

          if (cancelled) {
            this._resetPan();
            return;
          }

          if (hasMovedLeft) {
            this.cardAnimation = Animated.decay(this.state.pan, {
              velocity: { x: velocity, y: vy },
              deceleration: 0.98,
              toValue: 0,
            });
          } else {
            this.cardAnimation = Animated.spring(this.state.pan, {
              friction: 8,
              toValue: TRANSITION_STOPS_AT,
            });
          }

          this.cardAnimation.start(status => {
            if (status.finished) {
              this._advanceState(hasMovedLeft);
            } else {
              this._resetState();
            }

            this.cardAnimation = null;
          });
        } else {
          this._resetPan();
        }
      },
    });
  }

  _goToNextCard() {
    const { currentIndex, cards } = this.state;

    this.setState({
      currentIndex: currentIndex > cards.length - 2 ? 0 : currentIndex + 1,
    });
  }

  _goToPrevCard() {
    this.state.pan.setValue({ x: 0, y: 0 });
    const { currentIndex, cards } = this.state;

    this.setState({
      currentIndex: currentIndex < 1 ? cards.length - 1 : currentIndex - 1,
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.cards !== this.props.cards) {
      if (this.cardAnimation) {
        this.cardAnimation.stop();
        this.cardAnimation = null;
      }

      this.setState({
        cards: [].concat(nextProps.cards),
        currentIndex: 0,
      });
    }
  }

  _resetPan() {
    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: 0 },
      friction: 8,
    }).start();
  }

  _resetState() {
    this.state.pan.setValue({ x: 0, y: 0 });
  }

  _advanceState(hasMovedLeft) {
    this.state.pan.setValue({ x: 0, y: 0 });
    if (hasMovedLeft) {
      this._goToNextCard();
    } else {
      this._goToPrevCard();
    }
  }

  getCurrentCard() {
    return this.state.cards[this.state.currentIndex];
  }

  prepareStack() {
    const { cards, currentIndex } = this.state;
    const overflow = this.props.depth + currentIndex - cards.length;
    const stack = overflow > 0
      ? cards.slice(currentIndex, cards.length).concat(cards.slice(0, overflow))
      : cards.slice(currentIndex, currentIndex + this.props.depth);

    const prevSlide = currentIndex === 0
      ? cards[cards.length - 1]
      : cards[overflow > 0 ? currentIndex - 1 : currentIndex - 1];

    return [prevSlide].concat(stack).reverse();
  }

  prepareOffsets(cards: Array<InnerCardProps>) {
    return [INITIAL_OFFSET_Y]
      .concat(cards.map((_, i) => INITIAL_OFFSET_Y - STACK_OFFSET_Y * i))
      .reverse();
  }

  prepareScales(cards: Array<InnerCardProps>) {
    const step = 0.40 / cards.length;
    return [1, 1]
      .concat(cards.map((_, i) => 1 - step * i).slice(0, -1))
      .reverse();
  }

  renderStack() {
    const cards = this.prepareStack();
    const offsets = this.prepareOffsets(cards);
    const scales = this.prepareScales(cards);
    const { pan } = this.state;

    return cards.map((card, i) => {
      const leftOpacity = i > 0 ? 1 : 0.80;
      const initialOpacity = i > 0 ? 1 : 0;
      const rightOpacity = i === 1 ? 0 : 1;

      let scale = i < cards.length - 1
        ? 0.60 + 0.40 / cards.length * (i + 1)
        : 1;
      let lastScale = scale - 0.40 / cards.length;

      let style = {
        position: 'absolute',
        width: viewport.width,
        height: viewport.height - INITIAL_OFFSET_Y,
        top: this._deltaX.interpolate({
          inputRange: [
            -TRANSITION_STOPS_AT - 10,
            -TRANSITION_STOPS_AT,
            0,
            TRANSITION_STOPS_AT,
            TRANSITION_STOPS_AT + 10,
          ],
          outputRange: [
            offsets[i + 1],
            offsets[i + 1],
            offsets[i],
            offsets[i - 1],
            offsets[i - 1],
          ],
          extrapolate: 'extend',
        }),
        opacity: this._deltaX.interpolate({
          inputRange: [-TRANSITION_STOPS_AT, 0, TRANSITION_STOPS_AT],
          outputRange: [leftOpacity, initialOpacity, rightOpacity],
        }),
        transform: [
          {
            scale: this._deltaX.interpolate({
              inputRange: [
                -TRANSITION_STOPS_AT - 100,
                -TRANSITION_STOPS_AT,
                0,
                TRANSITION_STOPS_AT,
                TRANSITION_STOPS_AT + 100,
              ],
              outputRange: [
                scales[i + 1],
                scales[i + 1],
                scales[i],
                i > 1 ? scales[i - 1] : scales[0],
                i > 1 ? scales[i - 1] : scales[0],
              ],
            }),
          },
        ],
        elevation: i * 10,
      };

      if (i + 1 === cards.length) {
        let rotate = this._deltaX.interpolate({
          inputRange: [-TRANSITION_STOPS_AT, 0, TRANSITION_STOPS_AT],
          outputRange: ['-8deg', '-8deg', '0deg'],
        });

        let animatedCardStyles = {
          ...style,
          opacity: 1,
          transform: [],
        };

        return (
          <Interactable.View
            key={card.key}
            style={[
              {
                width: style.width + 200,
                height: style.height,
                left: -style.width - 50,
                backgroundColor: 'transparent',
              },
            ]}
            horizontalOnly={true}
            onSnap={e => {
              this._deltaX.setValue(0);
              if (e.nativeEvent.id === 'right') {
                this._goToPrevCard();
              }
            }}
            initialPosition={{ x: -TRANSITION_STOPS_AT }}
            boundaries={{ left: 0, bounce: 0 }}
            snapPoints={[
              { x: 0, tension: 300 },
              { x: viewport.width + 50, id: 'right', tension: 300 },
              // { x: -viewport.width, id: 'left' },
            ]}
            animatedValueX={this._deltaX}>
            <Animated.View key={card.key} style={animatedCardStyles}>
              {this.props.renderCard(card)}
            </Animated.View>
          </Interactable.View>
        );
      }

      if (i + 2 === cards.length) {
        const rotate = this._deltaX.interpolate({
          inputRange: [-viewport.width, 0, viewport.width],
          outputRange: ['-8deg', '0deg', '0deg'],
        });

        const animatedCardStyles = {
          ...style,
          opacity: 1,
          top: this._deltaX.interpolate({
            inputRange: [
              -TRANSITION_STOPS_AT,
              0,
              TRANSITION_STOPS_AT,
              TRANSITION_STOPS_AT + 10,
            ],
            outputRange: [
              offsets[i],
              offsets[i],
              offsets[i - 1],
              offsets[i - 1],
            ],
          }),
          transform: [
            // {
            //   translateX: this._deltaX.interpolate({
            //     inputRange: [-TRANSITION_STOPS_AT, 0, TRANSITION_STOPS_AT],
            //     outputRange: [0, 0, -TRANSITION_STOPS_AT],
            //     extrapolate: 'extend',
            //   }),
            // },
            {
              scale: this._deltaX.interpolate({
                inputRange: [
                  -TRANSITION_STOPS_AT,
                  0,
                  TRANSITION_STOPS_AT,
                  TRANSITION_STOPS_AT + 100,
                ],
                outputRange: [1, 1, scales[i - 1], scales[i - 1]],
                // extrapolate: 'extend',
              }),
            },

            { rotate: rotate },
          ],
        };

        return (
          <Interactable.View
            key={card.key}
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: 'transparent' },
            ]}
            horizontalOnly={true}
            // boundaries={{ right: 0, bounce: 0 }}
            onSnap={e => {
              this._deltaX.setValue(0);
              if (e.nativeEvent.id === 'left') {
                this._goToNextCard();
              }
              if (e.nativeEvent.id === 'right') {
                this._goToPrevCard();
              }
            }}
            dragEnabled={!this.dragDisabled}
            boundaries={{ right: 0, bounce: 0 }}
            snapPoints={[
              //  { x: TRANSITION_STOPS_AT, id: 'right' },
              { x: 0, tension: 300 },
              { x: -viewport.width - 50, id: 'left' },
            ]}
            animatedValueX={this._deltaX}>

            <Animated.View
              {...this._panResponder.panHandlers}
              style={[animatedCardStyles]}>
              {this.props.renderCard(card, card.key)}
            </Animated.View>

          </Interactable.View>
        );
      }

      return (
        <Animated.View key={card.key} style={style}>
          {this.props.renderCard(card, card.key)}
        </Animated.View>
      );
    });
  }

  render() {
    return (
      <View style={StyleSheet.absoluteFillObject}>
        {this.renderStack()}
      </View>
    );
  }
}
