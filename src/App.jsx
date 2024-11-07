import { useRef, useState } from "react";
import Sheet from "./Sheet";

function App() {
  const [addressBar, setAddressBar] = useState({
    value: "",
    decoded: "",
  });

  const height = 30;
  const [sharedValue, setSharedValue] = useState("");
  const inputRef = useRef("");
  const debounceTimer = useRef(null);

  // const handleInputChange = (event, c = "") => {
  //   if (c) inputRef.current = event.target.innerText;
  //   else inputRef.current = event.target.innerText;

  //   // Clear previous timer
  //   if (debounceTimer.current) {
  //     clearTimeout(debounceTimer.current);
  //   }
  //   console.log(inputRef, event, c);
  //   debounceTimer.current = setTimeout(() => {
  //     // setSharedValue(inputRef.current);
  //     // console.log(inputRef.current);
  //     // moveCaretToEnd();
  //   }, 300);
  // };
  const handleInputChange = (e) => {
    const newValue = e.target.innerText;
    setSharedValue(newValue);
    console.log("sfsdf");
    // moveCaretToEnd();
  };

  const moveCaretToEnd = () => {
    const element = formulaBarRef.current;
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const formulaBarRef = useRef(null);
  const [isEditable, setIsEditable] = useState(false);

  const handleEdit = () => {
    setIsEditable(true);
  };

  const [mergeSte, setMergeSte] = useState(false);

  return (
    <>
      <div style={{ height: `${height}px` }} className="formulaTab">
        <div className="inputCell addressCell ">{addressBar.value}</div>
        {/* <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 20 20"
        >
          <path
            fill="currentColor"
            d="M9.677 3.09c-.177-.035-.391-.04-.703.005a1.6 1.6 0 0 0-1.115.68c-.256.364-.412.863-.46 1.447c-.002.19-.035.87-.084 1.778H9.5a.5.5 0 0 1 0 1H7.26c-.126 2.25-.3 5.145-.361 5.938v.003l-.006.07c-.048.572-.104 1.252-.304 1.879c-.213.667-.6 1.31-1.33 1.738c-1.023.635-2.132.345-2.983-.08a.5.5 0 1 1 .448-.895c.747.374 1.436.483 2.011.123l.013-.008c.465-.27.727-.677.888-1.183c.165-.516.213-1.096.264-1.702l.002-.021v-.002c.06-.793.231-3.64.356-5.86H4.5a.5.5 0 1 1 0-1h1.813a76 76 0 0 0 .089-1.838c.054-.71.247-1.405.639-1.962c.4-.57.994-.973 1.783-1.094l.005-.001c.386-.055.722-.06 1.044.005c.324.065.604.193.884.361a.5.5 0 0 1-.514.858a1.7 1.7 0 0 0-.566-.239m7.177 6.056a.5.5 0 0 1 0 .708l-3.22 3.22a163 163 0 0 0 1.394 2.466l.041.072c.065.115.111.19.154.25c.06.084.117.144.244.214c.216.037.28-.008.306-.025a.6.6 0 0 0 .125-.127a4 4 0 0 0 .11-.145q.037-.053.092-.126a.5.5 0 0 1 .8.6l-.057.078c-.113.157-.28.39-.5.541c-.316.22-.692.268-1.148.17a.5.5 0 0 1-.12-.042a1.7 1.7 0 0 1-.666-.556a4 4 0 0 1-.208-.336l-.045-.079a134 134 0 0 1-1.257-2.22l-3.045 3.045a.5.5 0 0 1-.708-.707l3.246-3.246a150 150 0 0 0-1.14-2.024a3.6 3.6 0 0 0-.327-.549a1.1 1.1 0 0 0-.33-.317c-.061-.02-.117-.014-.205.041c-.12.074-.249.213-.39.401a.5.5 0 1 1-.8-.6c.158-.211.378-.473.66-.649c.302-.189.695-.287 1.125-.115q.02.007.038.017c.298.15.53.392.702.622c.17.228.308.476.413.685c.135.227.537.944.989 1.753l3.02-3.02a.5.5 0 0 1 .707 0"
          />
        </svg> */}
        {/* <div
          ref={formulaBarRef}
          contentEditable={true}
          className="inputCell formulaBar"
          onClick={handleEdit}
          onInput={handleInputChange}
          suppressContentEditableWarning={true}
        >
          {sharedValue}
        </div> */}
        {/* <div
          className={`${
            !addressBar.value.includes(":") ? "disabled" : ""
          } mergeCell ${mergeSte ? "active" : "not_active"}`}
          onClick={handleMerge}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.1em"
            height="1.1em"
            viewBox="0 0 24 24"
          >
            <path
              fill={addressBar.value.includes(":") ? "#504f4f" : "#5f5d5d99"}
              d="M4 9q-.425 0-.712-.288T3 8V5q0-.825.588-1.412T5 3h3q.425 0 .713.288T9 4t-.288.713T8 5H5v3q0 .425-.288.713T4 9m16 0q-.425 0-.712-.288T19 8V5h-3q-.425 0-.712-.288T15 4t.288-.712T16 3h3q.825 0 1.413.588T21 5v3q0 .425-.288.713T20 9m-3.875 6.125L13.7 12.7q-.3-.3-.3-.7t.3-.7l2.425-2.425q.3-.3.713-.3t.712.3t.3.713t-.3.712l-.725.7H21q.425 0 .712.288T22 12t-.288.713T21 13h-4.175l.725.7q.3.3.3.713t-.3.712t-.712.3t-.713-.3m-9.65 0q-.3-.3-.312-.712t.287-.713l.725-.7H3q-.425 0-.712-.288T2 12t.288-.712T3 11h4.175l-.725-.7q-.3-.3-.288-.712t.313-.713t.7-.3t.7.3L10.3 11.3q.3.3.3.7t-.3.7l-2.425 2.425q-.3.3-.7.3t-.7-.3M5 21q-.825 0-1.412-.587T3 19v-3q0-.425.288-.712T4 15t.713.288T5 16v3h3q.425 0 .713.288T9 20t-.288.713T8 21zm11 0q-.425 0-.712-.288T15 20t.288-.712T16 19h3v-3q0-.425.288-.712T20 15t.713.288T21 16v3q0 .825-.587 1.413T19 21z"
            />
          </svg>
        </div> */}
      </div>
      <Sheet
        excludeHeight={height}
        setAddressBar={setAddressBar}
        handleInputChange={handleInputChange}
        formulaBarRef={inputRef}
        sharedValue={sharedValue}
        setSharedValue={setSharedValue}
        formulaEditState={isEditable}
        setFormulaEditState={setIsEditable}
        mergeSte={mergeSte}
        setMergeSte={setMergeSte}
      />
    </>
  );
}

export default App;
