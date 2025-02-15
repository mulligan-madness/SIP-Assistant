import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChatInterface from '@/components/ChatInterface.vue'

describe('ChatInterface.vue', () => {
  it('renders the chat interface', () => {
    const wrapper = mount(ChatInterface)
    expect(wrapper.find('.chat').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('SIP Chat Assistant')
  })

  it('has input field and send button', () => {
    const wrapper = mount(ChatInterface)
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('allows entering messages', async () => {
    const wrapper = mount(ChatInterface)
    const input = wrapper.find('textarea')
    await input.setValue('Test message')
    expect(input.element.value).toBe('Test message')
  })
}) 