import { importImageToActiveLayer } from '~/io/internal/import'; // 上で作った関数

const ImportImageButton = () => {
  let fileInputRef: HTMLInputElement | undefined;

  const handleClick = () => {
    fileInputRef?.click(); // hidden input を手動でクリック
  };

  const handleFileChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      importImageToActiveLayer(file);
      target.value = ''; // 同じファイルを再選択可能にする
    }
  };

  return (
    <>
      <button onClick={handleClick}>Import</button>

      <input
        type='file'
        accept='image/*'
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
};

export default ImportImageButton;
