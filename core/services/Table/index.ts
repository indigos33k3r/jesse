import chalk from "chalk";
import EasyTable from 'easy-table';
import $ from "../Helpers";
import { MultiValueTableDataInterface, TableDataInterface } from "./types";

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
    }, 

    multiValue(data: MultiValueTableDataInterface[], title: string): void {
        if ($.isTesting() || $.isFitting()) return;

        const t = new EasyTable();

        data.forEach(row => {
            row.item.forEach(item => {
                t.cell(
                    chalk.bold(item.key), 
                    item.color ? chalk.keyword(item.color)(`${item.value}`) : `${item.value}`
                );
            });
    
            t.newRow();
        });

        console.log(t.toString());
    }
}

export default Table; 