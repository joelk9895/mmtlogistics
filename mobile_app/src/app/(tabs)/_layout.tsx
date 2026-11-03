import React from 'react';
import { NativeTabs } from 'expo-router/native-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#0A84FF"
      blurEffect="systemDefault"
      minimizeBehavior="automatic"
      sidebarAdaptable
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'arrow.triangle.turn.up.right.diamond',
            selected: 'arrow.triangle.turn.up.right.diamond.fill',
          }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="navigate" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="allowance">
        <NativeTabs.Trigger.Label>Allowance</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'banknote',
            selected: 'banknote.fill',
          }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="wallet" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="expenses">
        <NativeTabs.Trigger.Label>Expenses</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'fuelpump',
            selected: 'fuelpump.fill',
          }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="receipt" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="documents">
        <NativeTabs.Trigger.Label>Docs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'doc.text',
            selected: 'doc.text.fill',
          }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="document-text" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
