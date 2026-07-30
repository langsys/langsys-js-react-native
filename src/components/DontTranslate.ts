import { createElement, type ReactElement, type ReactNode } from 'react';
import { Text } from 'react-native';

export interface DontTranslateProps {
    children?: ReactNode;
}

/**
 * API-parity marker for content that must never translate. On the web this
 * carries `translate="no"` for the DOM tokenizer; React Native has no DOM
 * walker (there is no `<Translate>` here), so today this is a plain `<Text>`
 * pass-through — untagged content is never translated anyway, because
 * coverage in RN is explicit (`useT()` only). It exists so shared code and
 * future RN content-block support keep the same component vocabulary.
 */
export function DontTranslate(props: DontTranslateProps): ReactElement {
    return createElement(Text, null, props.children);
}

export default DontTranslate;
