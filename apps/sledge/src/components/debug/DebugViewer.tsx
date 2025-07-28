import { Component, For, Show, createSignal } from 'solid-js';
import {
  bufferToDataURL,
  clearDebugData,
  closeDebugViewer,
  getDebugSessions,
  getIsViewerOpen,
  removeDebugSession,
  type DebugImage,
  type DebugSession,
} from '~/utils/DebugViewer';
import './DebugViewer.css';

const DebugViewer: Component = () => {
  const [selectedSession, setSelectedSession] = createSignal<string | null>(null);
  const [selectedImage, setSelectedImage] = createSignal<DebugImage | null>(null);

  const sessions = getDebugSessions;
  const isOpen = getIsViewerOpen;

  const handleClose = () => {
    closeDebugViewer();
    setSelectedSession(null);
    setSelectedImage(null);
  };

  const handleClearAll = () => {
    clearDebugData();
    setSelectedSession(null);
    setSelectedImage(null);
  };

  const handleRemoveSession = (sessionId: string) => {
    removeDebugSession(sessionId);
    if (selectedSession() === sessionId) {
      setSelectedSession(null);
      setSelectedImage(null);
    }
  };

  const getSelectedSessionData = (): DebugSession | null => {
    const sessionId = selectedSession();
    if (!sessionId) return null;
    return sessions().find((s) => s.id === sessionId) || null;
  };

  return (
    <Show when={isOpen()}>
      <div class='debug-viewer-overlay' onClick={handleClose}>
        <div class='debug-viewer-modal' onClick={(e) => e.stopPropagation()}>
          <div class='debug-viewer-header'>
            <h2>Debug Image Viewer</h2>
            <div class='debug-viewer-actions'>
              <button onClick={handleClearAll} class='btn-danger'>
                Clear All
              </button>
              <button onClick={handleClose} class='btn-close'>
                ×
              </button>
            </div>
          </div>

          <div class='debug-viewer-content'>
            {/* セッション一覧 */}
            <div class='debug-sessions'>
              <h3>Debug Sessions</h3>
              <div class='session-list'>
                <For each={sessions()}>
                  {(session) => (
                    <div
                      class={`session-item ${selectedSession() === session.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedSession(session.id);
                        setSelectedImage(null);
                      }}
                    >
                      <div class='session-info'>
                        <div class='session-name'>{session.name}</div>
                        <div class='session-meta'>
                          {session.images.length} images • {new Date(session.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSession(session.id);
                        }}
                        class='btn-remove'
                      >
                        ×
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* 画像一覧 */}
            <Show when={selectedSession()}>
              <div class='debug-images'>
                <h3>Images in {getSelectedSessionData()?.name}</h3>
                <div class='image-grid'>
                  <For each={getSelectedSessionData()?.images || []}>
                    {(image) => (
                      <div class={`image-thumbnail ${selectedImage()?.id === image.id ? 'selected' : ''}`} onClick={() => setSelectedImage(image)}>
                        <img
                          src={bufferToDataURL(image.buffer, image.width, image.height)}
                          alt={image.name}
                          style={{
                            width: '100px',
                            height: '100px',
                            'object-fit': 'contain',
                          }}
                        />
                        <div class='image-name'>{image.name}</div>
                        <div class='image-size'>
                          {image.width}×{image.height}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* 画像詳細表示 */}
            <Show when={selectedImage()}>
              <div class='debug-image-detail'>
                <h3>{selectedImage()!.name}</h3>
                <div class='image-info'>
                  Size: {selectedImage()!.width}×{selectedImage()!.height} • Time: {new Date(selectedImage()!.timestamp).toLocaleTimeString()}
                </div>
                <div class='image-display'>
                  <img
                    src={bufferToDataURL(selectedImage()!.buffer, selectedImage()!.width, selectedImage()!.height)}
                    alt={selectedImage()!.name}
                    style={{
                      'max-width': '100%',
                      'max-height': '400px',
                      'image-rendering': 'pixelated',
                      border: '1px solid #ccc',
                    }}
                  />
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default DebugViewer;
