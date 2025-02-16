import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ChatInterface from '@/components/ChatInterface.vue'
import SettingsModal from '@/components/SettingsModal.vue'

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

describe('ChatInterface Settings Button and Modal', () => {
  it('renders the settings button', () => {
    const wrapper = mount(ChatInterface)
    const settingsButton = wrapper.find('.settings-button')
    expect(settingsButton.exists()).toBe(true)
  })

  it('shows SettingsModal upon clicking the settings button', async () => {
    const wrapper = mount(ChatInterface)

    // Initially, no modal backdrop should be visible
    expect(wrapper.find('.modal-backdrop').exists()).toBe(false)

    // Click the settings button
    const settingsButton = wrapper.find('.settings-button')
    await settingsButton.trigger('click')

    // Now, the modal backdrop should be rendered
    expect(wrapper.find('.modal-backdrop').exists()).toBe(true)

    // Also check that it contains expected text from the modal
    expect(wrapper.find('.modal-backdrop').text()).toContain('Server Settings')
  })

  it('mounts ChatInterface without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mount(ChatInterface)
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })
}) 