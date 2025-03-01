# Component Structure for SIP-Assistant Refactoring

## Directory Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatHeader.vue
│   │   ├── ControlButtons.vue
│   │   ├── MessageInput.vue
│   │   ├── MessageList.vue
│   │   └── ThinkingIndicator.vue
│   ├── research/
│   │   └── ResearchPanel.vue
│   ├── settings/
│   │   ├── DataManagementSettings.vue
│   │   ├── ProviderSettings.vue
│   │   └── SystemSettings.vue
│   ├── ChatInterface.vue (to be refactored)
│   └── SettingsModal.vue (to be refactored)
```

## Component Interfaces

### Chat Components

1. **ChatHeader.vue**
   - **Props**:
     - `showSettings`: Boolean
   - **Events**:
     - `toggle-settings`: Emitted when settings button is clicked

2. **MessageList.vue**
   - **Props**:
     - `messages`: Array of message objects
   - **Events**:
     - `copy`: Emitted when copy button is clicked with message content

3. **MessageInput.vue**
   - **Props**:
     - `isLoading`: Boolean
   - **Events**:
     - `send`: Emitted with message content when send button is clicked or enter is pressed

4. **ThinkingIndicator.vue**
   - **Props**:
     - `isLoading`: Boolean
     - `thinkingTime`: String

5. **ControlButtons.vue**
   - **Events**:
     - `export`: Emitted when export button is clicked
     - `enforce`: Emitted when enforce headers button is clicked
     - `pretty`: Emitted when pretty text button is clicked
     - `markdown`: Emitted when markdown button is clicked

### Settings Components

1. **ProviderSettings.vue**
   - **Props**:
     - `changingProvider`: Boolean
   - **Events**:
     - `change-llm`: Emitted with provider ID when provider is changed

2. **DataManagementSettings.vue**
   - **Props**:
     - `scraping`: Boolean
     - `generatingContext`: Boolean
     - `elapsedTime`: Number
     - `contextTime`: Number
     - `scrapingMessage`: String
     - `contextPun`: String
   - **Events**:
     - `scrape-forum`: Emitted when scrape button is clicked
     - `regenerate-context`: Emitted when regenerate context button is clicked

3. **SystemSettings.vue**
   - **Props**:
     - `serverRestarting`: Boolean
   - **Events**:
     - `restart-server`: Emitted when restart server button is clicked
     - `reload-page`: Emitted when reload page button is clicked

### Research Components

1. **ResearchPanel.vue**
   - **Props**:
     - `visible`: Boolean
     - `researchData`: Object (placeholder for future data)
   - **Events**:
     - `toggle`: Emitted when panel visibility should be toggled

## Next Steps

1. Implement each component with Vue 3's script setup syntax
2. Extract functionality from existing components
3. Update the parent components to use the new component structure
4. Ensure all props and events are properly connected 