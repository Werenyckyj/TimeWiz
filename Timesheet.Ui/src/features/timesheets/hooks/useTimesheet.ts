import { useContext } from "react";
import { TimesheetContext } from "../stroe/TimesheetContext";

export const useTimesheet = () => {
    const context = useContext(TimesheetContext);
    if (!context) {
        throw new Error("useTimesheet must be used within a TimesheetProvider");
    }
    return context;
}