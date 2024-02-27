const board = document.querySelector('.board');
const selectionDiv = document.querySelector('.selection');

let localStorageMemos = JSON.parse(localStorage.getItem('memos')) || [];

let memoList = [];

let mouseClicked = false;

let movingMemo = false;

let resizingMemo = false;

let offsetXStart = 0;
let offsetYStart = 0;
let offsetXEnd = 0;
let offsetYEnd = 0;

let offsetYCurrent = 0;
let offetXCurrent = 0;

board.addEventListener('mousedown', (e) => {
    mouseClicked = true;

    offsetXStart = e.offsetX;
    offsetYStart = e.offsetY;

    if (!movingMemo) {
        selectionDiv.style.top = `${offsetYStart}px`;
        selectionDiv.style.left = `${offsetXStart}px`;
        selectionDiv.style.display = 'block';
        board.style.cursor = 'crosshair';
    }
})

board.addEventListener('mouseup', (e) => {
    mouseClicked = false;
    offsetXEnd = e.offsetX;
    offsetYEnd = e.offsetY;

    let width = offsetXEnd - offsetXStart;
    let height = offsetYEnd - offsetYStart;

    if (width >= 50 && height >= 50 && !movingMemo && !resizingMemo) {

        let memo = new Memo(
            Date.now(),
            { left: offsetXStart, top: offsetYStart },
            { width, height },
            ''
        );
        memoList.push(memo);
        updateLocalStorage();
    }

    selectionDiv.style.width = '0px';
    selectionDiv.style.height = '0px';
    selectionDiv.style.display = 'none';
    board.style.cursor = 'default';
})

board.addEventListener('mousemove', (e) => {

    if (mouseClicked && !movingMemo && !resizingMemo) {
        offsetXCurrent = e.offsetX - offsetXStart;
        offsetYCurrent = e.offsetY - offsetYStart;

        selectionDiv.style.width = `${offsetXCurrent}px`;
        selectionDiv.style.height = `${offsetYCurrent}px`;
    }
})


class Memo {
    constructor(id, position, size, content) {
        this.id = id
        this.position = position;
        this.size = size;
        this.content = content;
        this.moving = false
        this.resizing = false;
        this.createMemo();

    }

    createMemo() {
        this.div = document.createElement('div');
        this.div.classList.add('memo');

        this.div.style.top = `${this.position.top}px`;
        this.div.style.left = `${this.position.left}px`;
        this.div.style.width = `${this.size.width}px`;
        this.div.style.height = `${this.size.height}px`;

        this.move = document.createElement('div');
        this.move.classList.add('move');
        this.move.addEventListener('mousedown', this.mouseDownMove.bind(this));
        window.addEventListener('mouseup', this.mouseUp.bind(this));
        this.div.appendChild(this.move);

        this.close = document.createElement('div');
        this.close.classList.add('close');
        this.move.appendChild(this.close);
        this.close.addEventListener('click', this.deleteMemo.bind(this));

        this.text = document.createElement('textarea');
        this.text.classList.add('text');
        this.text.value = this.content;
        this.text.addEventListener('keyup', this.updateText.bind(this));
        this.text.addEventListener('blur', updateLocalStorage);
        this.div.appendChild(this.text);

        this.resize = document.createElement('div');
        this.resize.classList.add('resize');
        this.resize.addEventListener('mousedown', this.mouseDownResize.bind(this));
        this.div.appendChild(this.resize);

        board.appendChild(this.div);
    }

    mouseDownMove(e) {
        movingMemo = true;

        this.moving = true

        this.move.style.cursor = 'grabbing'
        this.move.style.backgroundColor = '#fcc42a55'

        this.movingXDist = e.clientX - this.position.left;
        this.movingYDist = e.clientY - this.position.top;
    }

    mouseDownResize(e) {
        resizingMemo = true;
        this.resizing = true;
    }

    mouseUp() {

        const currentPosition = { left: this.position.left, top: this.position.top };
        Object.freeze(currentPosition);

        const currentSize = { width: this.size.width, height: this.size.height }
        Object.freeze(currentSize);


        movingMemo = false;
        resizingMemo = false;

        this.moving = false
        this.resizing = false;

        this.move.style.cursor = 'grab'
        this.move.style.backgroundColor = 'transparent'
        
        this.position.top = this.div.offsetTop;
        this.position.left = this.div.offsetLeft;


        if (this.position.top < 0) {
            this.position.top = 0;
            this.div.style.top = 0;
        }

        let boardHeight = board.getBoundingClientRect().bottom;

        if (this.position.top + this.size.height > boardHeight) {
            this.position.top = boardHeight - (this.size.height + 10);
            this.div.style.top = `${this.position.top}px`;
        }

        if (this.position.left < 0) {
            this.position.left = 0;
            this.div.style.left = '0px';
        }

        let boardRight = board.getBoundingClientRect().right;

        if (this.position.left + this.size.width > boardRight) {
            this.position.left = boardRight - (this.size.width + 10);
            this.div.style.left = `${this.position.left}px`;
        }

        if (JSON.stringify(this.position) != JSON.stringify(currentPosition) || JSON.stringify(this.size) != JSON.stringify(currentSize)) {
            
            updateLocalStorage();
        }
    }

    deleteMemo() {
        memoList = memoList.filter(memo => {
            return memo.id != this.id;
        })

        updateLocalStorage()
        this.div.remove();
    }

    moveMemo(e) {
        this.div.style.top = `${e.clientY - this.movingYDist}px`;
        this.div.style.left = `${e.clientX - this.movingXDist}px`;
    }

    resizeMemo(e) {

        let height = e.clientY - this.position.top;
        let width = e.clientX - this.position.left;

        if (width >= 50 && height >= 50) {

            this.size.height = height
            this.size.width = width

            this.div.style.height = `${height}px`;
            this.div.style.width = `${width}px`;
        }
        updateLocalStorage()
    }

    updateText() {
        this.content = this.text.value;
    }
}

localStorageMemos.forEach(memo => {
    let storedMemo = new Memo(
        memo.id,
        { left: memo.position.left, top: memo.position.top },
        { width: memo.size.width, height: memo.size.height },
        memo.content
    )
    memoList.push(storedMemo);
})

function updateLocalStorage() {
    if (localStorage.getItem('memos') != JSON.stringify(memoList)) {
        console.log('Local storage updated')
        localStorage.setItem('memos', JSON.stringify(memoList));
    }
};

window.addEventListener('mousemove', (e) => {
    for (let i = 0; i < memoList.length; i++) {
        if (memoList[i].moving) {
            memoList[i].moveMemo(e);
        }

        if (memoList[i].resizing) {
            memoList[i].resizeMemo(e)
        }
    }
})

window.addEventListener('mouseup', () => {
    for (let i = 0; i < memoList.length; i++) {
        memoList[i].mouseUp();
    }
})

// 터치 이벤트에 대응하기 위한 수정된 부분

// 터치 시작 이벤트
board.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 기본 행동 방지
    mouseClicked = true;

    let touch = e.touches[0]; // 첫 번째 터치 이벤트 가져오기
    offsetXStart = touch.clientX - board.getBoundingClientRect().left;
    offsetYStart = touch.clientY - board.getBoundingClientRect().top;

    if (!movingMemo) {
        selectionDiv.style.top = `${offsetYStart}px`;
        selectionDiv.style.left = `${offsetXStart}px`;
        selectionDiv.style.display = 'block';
        board.style.cursor = 'crosshair';
    }
});

// 터치 이동 이벤트
board.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 스크롤 방지
    if (mouseClicked && !movingMemo && !resizingMemo) {
        let touch = e.touches[0];
        offsetXCurrent = touch.clientX - board.getBoundingClientRect().left - offsetXStart;
        offsetYCurrent = touch.clientY - board.getBoundingClientRect().top - offsetYStart;

        selectionDiv.style.width = `${offsetXCurrent}px`;
        selectionDiv.style.height = `${offsetYCurrent}px`;
    }
});

// 터치 종료 이벤트
board.addEventListener('touchend', (e) => {
    mouseClicked = false;
    let touch = e.changedTouches[0]; // 마지막으로 변경된 터치 이벤트 가져오기
    offsetXEnd = touch.clientX - board.getBoundingClientRect().left;
    offsetYEnd = touch.clientY - board.getBoundingClientRect().top;

    let width = offsetXEnd - offsetXStart;
    let height = offsetYEnd - offsetYStart;

    if (width >= 50 && height >= 50 && !movingMemo && !resizingMemo) {
        let memo = new Memo(
            Date.now(),
            { left: offsetXStart, top: offsetYStart },
            { width, height },
            ''
        );
        memoList.push(memo);
        updateLocalStorage();
    }

    selectionDiv.style.width = '0px';
    selectionDiv.style.height = '0px';
    selectionDiv.style.display = 'none';
    board.style.cursor = 'default';
});

// 창 전체에서 메모 이동 및 크기 조정 처리
window.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 기본 행동 및 스크롤 방지
    for (let i = 0; i < memoList.length; i++) {
        if (memoList[i].moving || memoList[i].resizing) {
            let touch = e.touches[0];
            if (memoList[i].moving) {
                memoList[i].moveMemo({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
            if (memoList[i].resizing) {
                memoList[i].resizeMemo({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }
    }
}, {passive: false}); // passive 옵션을 false로 설정하여 preventDefault()가 작동하도록 함

// 창 전체에서 터치 종료 이벤트 처리
window.addEventListener('touchend', () => {
    for (let i = 0; i < memoList.length; i++) {
        memoList[i].mouseUp();
    }
});

