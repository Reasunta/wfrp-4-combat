class GameTable {
    constructor(parent_dom) {
        this.archive = [];
        this.history = [];

        this.defaultFilename = 'backgamut_game.csv';
        this.fileHandleSupported = ('showSaveFilePicker' in window);
        this.fileHandle = undefined;

        this.template =
        '<h3>Игровая таблица</h3>' +
        '<div class="game-table-scroll"><table class="table table-striped table-hover text-center" id="game_table">' +
        '<thead class="head-center">' +
        '<tr><th>#</th><th>Игрок 1</th><th>Игрок 2</th></tr></thead>' +
        '<tbody></tbody></table></div>';

        this.row_template =
        '<tr><td name="turn_id"><small class="text-muted"></small></td><td name="player_1_turn"></td><td name="player_2_turn"></td></tr>';

        this.edit_template = '<label class="label" '+
        'style="position: absolute;right: 5px;top: 0px;padding-inline: 15px;padding-block: 5px;"></label>'

        this.import = this.initImport();

        this.parent_dom = parent_dom;
        this.startNewGame();
    }

    startNewGame = function() {
        if(this.history.length % 2 == 1) this.history.pop();
        if (this.history.length > 0) this.archive.push(this.history);

        this.history = [];
        this.edited_values = [];
        this.edit_index = 0;
        this.is_insert_mode = false;
        this.is_edit_mode = false;

        this.dom = $(this.template);

        this.parent_dom.empty();
        this.parent_dom.append(this.dom);
    }

    initImport = function() {
        let _import = document.createElement('input');
        _import.type = 'file';

        _import.onchange = e => {
           let file = e.target.files[0];
           let reader = new FileReader();
           reader.readAsText(file,'UTF-8');

           reader.onload = readerEvent => {
              let content = readerEvent.target.result;
              this.history = JSON.parse("[" + content + "]");
              document.dispatchEvent(new Event("keydown"));
           }
        }

        return _import;
    }

    insertValue = function(input) {
        if(this.isInsertMode()) {
            this.edited_values.push(input);
            if(this.edited_values.length == 2)
                this.history.splice(this.edit_index, 0, this.edited_values.pop(), this.edited_values.pop());
        }
        else if(this.isEditMode()) {
            this.edited_values.push(input);
            if(this.edited_values.length == 2)
                this.history.splice(this.edit_index, 2, this.edited_values.pop(), this.edited_values.pop());
        }
        else this.history.push(input);
    }

    removeValue = function() {
        if (this.isInsertMode() || this.isEditMode()) {
            if(this.edited_values[0]) this.edited_values.pop();
            else {
                this.history.splice(this.edit_index, 2);
                if (this.history.length == 0) this.exitModes()
                else if (this.edit_index >= this.history.length) this.moveEditedCell("left");
            }
        }
        else {
            this.history.pop();
            if(this.history.length % 2 == 1) this.history.pop();
        }
    }

    scrollToRow = function(row_index) {
        let scroll_position = Math.max(
            this.dom.find("tbody tr").height() * row_index + this.dom.find("th").offset().top - this.dom.last().height(), 0);
        this.dom.animate({
            scrollTop: scroll_position
        }, 50);
    }

    renderTable = function() {
        let tbody = this.dom.find('tbody');
        tbody.empty();

        for(let i = 0; i < this.history.length; i += 4) {
            let row = $(this.row_template);

            row.find('[name="turn_id"] small').text(this.getRowIndex(i) + 1);
            row.find('[name="player_1_turn"]').text((this.history[i] || "") + " " + (this.history[i + 1] || ""));
            row.find('[name="player_2_turn"]').text((this.history[i + 2] || "") + " " + (this.history[i + 3] || ""));

            if ((this.isInsertMode() || this.isEditMode()) && (this.edit_index == i || this.edit_index == i + 2)) {
                let col = row.find("td:nth-child(" + (2 + (this.edit_index - i) / 2) + ")");

                if (this.isInsertMode()) col.addClass("info");
                if (this.isEditMode()) col.addClass("success");

                if(this.edited_values.length == 1) {
                    let lbl = $(this.edit_template);

                    if (this.isInsertMode()) lbl.addClass("label-info");
                    if (this.isEditMode()) lbl.addClass("label-success");
                    lbl.text(this.edited_values[0]);
                    col.append(lbl);
                }
            }

            tbody.append(row);
        }

        let row_to_scroll =  (this.isInsertMode() || this.isEditMode())
            ? this.getRowIndex(this.edit_index)
            : this.getRowIndex();

        this.scrollToRow(row_to_scroll);
    }

    getHistory = function() {
        return Object.assign([], this.history);
    }

    switchInsertMode = function() {
        if(this.history.length == 0) return;

        this.is_insert_mode = !this.is_insert_mode;
        if (this.is_insert_mode && !this.is_edit_mode) this.edit_index = this.getLastIndex();
        this.is_edit_mode = false;
    }
    isInsertMode = function() { return this.is_insert_mode; }

    switchEditMode = function() {
        if(this.history.length == 0) return;

        this.is_edit_mode = !this.is_edit_mode;
        if (this.is_edit_mode && !this.is_insert_mode) this.edit_index = this.getLastIndex();
        this.is_insert_mode = false;
    }

    isEditMode = function() { return this.is_edit_mode; }

    getLastIndex = function() {return (this.history.length - 1) - (this.history.length - 1) % 2}
    getRowIndex = function(history_index) {
        let index = history_index == undefined ? this.getLastIndex() : history_index;
        return Math.floor(index / 4);
    }

    moveEditedCell = function(way) {
        if (!this.isInsertMode() && !this.isEditMode()) return;

        if (way == "up") this.edit_index = Math.max(this.edit_index - 4, 0);
        if (way == "down") this.edit_index = Math.min(this.edit_index + 4, this.getLastIndex());
        if (way == "left") this.edit_index = Math.max(this.edit_index - 2, 0);;
        if (way == "right") this.edit_index = Math.min(this.edit_index + 2, this.getLastIndex());
    }

    exitModes = function() {
        this.is_insert_mode = false;
        this.is_edit_mode = false;
    }

    getContentCsv = function() {
        let content = "data:text/csv;charset=utf-8,";
        content += this.history.join(",") + "\r\n";
        return content;
    }

    saveHistoryToCurrentFile = function() {
        if (this.fileHandle == undefined) {
            return this.saveHistoryToNewFile();
        } else {
            let content = this.getContentCsv();
            this.writeContentToFileHandle(this.fileHandle, content);

            // @todo(v.radko): change popup to good-looking and without buttons
            // possible implementation: https://getbootstrap.com/docs/4.0/components/alerts/
            window.alert(`Saved '${this.fileHandle.name}'!`);
        }
    }

    saveHistoryToNewFile = async function() {
        let content = this.getContentCsv();

        if (this.fileHandleSupported) {
            let options = {
                suggestedName : this.defaultFilename,
                types: [ { description: 'CSV File', accept: { 'text/csv': ['.csv'] } }]
            }

            this.fileHandle = await window.showSaveFilePicker(options);

            if (this.fileHandle) {
                await this.writeContentToFileHandle(this.fileHandle, content);
            } else {
                // Could not open FileHandle, fallback to downloading file with default name.
                this.downloadFile();
            }
        } else {
            this.downloadFile();
        }
    }

    writeContentToFileHandle = async function(fileHandle, content) {
        const writer = await fileHandle.createWritable();
        await writer.write(content);
        await writer.close();
    }

    downloadFile = function() {
        let encodedUri = encodeURI(content);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", this.defaultFilename);
        document.body.appendChild(link); // Required for FF
        link.click();

        setTimeout(() => document.body.removeChild(link), 0);
    }

    importHistory = function() {
        this.import.click();
    }
}
