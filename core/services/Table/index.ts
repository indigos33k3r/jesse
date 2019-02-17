import chalk from "chalk";
import EasyTable from 'easy-table';
import TableDataInterface from "../../interfaces/TableDataInterface";
import $ from "../Helpers";

const Table = {
    keyValue(data: TableDataInterface[], title: string): void {
        if ($.isTesting() || $.isFitting()) return;
         
        const t = new EasyTable();

        data.forEach(item => {
            t.cell(chalk.bold(title), chalk.grey(`${item.key}:`));
            t.cell(' ', item.value);

            t.newRow();
        });

        console.log(t.toString());
    }
}

export default Table; 