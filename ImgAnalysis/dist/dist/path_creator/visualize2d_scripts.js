const root = document.getElementById("visualize2d_area");
var workspace;
export function SetWorkspace(workspace_element) {
    workspace_element.id = "workspace";
    root.appendChild(workspace_element);
    const workspace_dims = workspace_element.getBoundingClientRect();
    if (workspace_dims.width > 350.0 && workspace_dims.height > 350.0) {
        workspace = workspace_element;
    }
    else {
        throw new Error("Workspace is too small (min 350x350px)");
    }
}
export function DefaultTicker(time) { return time + 1; }
export class Runtime {
    constructor(project_function) {
        // animations
        this.time = this.vanillaVariableTracker(0);
        // backend
        this.projectFunc = project_function;
        this.variables = {};
        // frontend toolbar
        this.toolbar = document.createElement("div");
        this.toolbar.className = "drag_bar";
        this.toolbar.style.left = "calc(100% - 300px)";
        const draggable = document.createElement("div");
        draggable.className = "draggable";
        this.toolbar.appendChild(draggable);
        // makeMovable(this.toolbar, draggable)
        root.appendChild(this.toolbar);
    }
    vanillaVariableTracker(variable) {
        const variableHandler = {
            set(target, property, value) {
                target[property] = value;
                return true;
            },
        };
        const monitoredVariable = new Proxy({ value: variable }, variableHandler);
        return monitoredVariable;
    }
    sliderVariableTracker(variable, slider_label, slider) {
        const variableHandler = {
            set(target, property, value) {
                slider_label.innerHTML = value;
                target[property] = value;
                return true;
            },
        };
        const monitoredVariable = new Proxy({ value: variable }, variableHandler);
        return monitoredVariable;
    }
    varNumber(name, min, max) {
        console.log(`Created new Runtime variable: ${name}`);
        var [var_input, label, slider_value, input] = this.CreateSlider(name, min, max);
        var input_slider = input;
        window[name] = this.sliderVariableTracker((min + max) / 2, slider_value, input_slider);
        this.variables[name] = +window[name].value;
        input_slider.addEventListener("input", (e) => {
            window[name].value = input_slider.value;
            this.variables[name] = +window[name].value;
            this.UpdateScreen(e);
        });
        this.toolbar.style.top = `calc(100% - ${this.toolbar.getBoundingClientRect().height}px)`;
    }
    UpdateScreen(e) {
        workspace.remove();
        this.projectFunc(Object.values(this.variables), +this.time.value);
    }
    CreateSlider(name, min, max) {
        var var_input = document.createElement("div");
        var_input.className = "var_input";
        var label = document.createElement("label");
        label.setAttribute("for", name);
        label.innerHTML = name;
        var_input.appendChild(label);
        var slider_value = document.createElement("code");
        slider_value.className = "CodeCell";
        slider_value.style.padding = "0px";
        slider_value.style.width = "20px";
        slider_value.innerHTML = ((min + max) / 2).toString();
        var_input.appendChild(slider_value);
        var input = document.createElement("input");
        input.id = name;
        input.className = "slider";
        input.setAttribute("type", "range");
        input.setAttribute("min", min.toString());
        input.setAttribute("max", max.toString());
        input.value = ((min + max) / 2).toString();
        var_input.appendChild(input);
        this.toolbar.appendChild(var_input);
        return ([var_input, label, slider_value, input]);
    }
    CreateTicker(TickerFunction) {
        // front end
        const ticker_element = document.createElement("div");
        ticker_element.className = "ticker";
        this.toolbar.insertBefore(ticker_element, this.toolbar.children[1]);
        var [var_input, label, slider_value, input] = this.CreateSlider("time", 0, 100);
        var input_slider = input;
        this.toolbar.insertBefore(var_input, this.toolbar.children[2]);
        input_slider.value = "0";
        slider_value.innerHTML = "0";
        const text = document.createElement("div");
        text.innerHTML = '<b>Run </b>TickerFunction<b> <br>every <input type="number" class="CodeCell" id="tickerInterval" style="margin: 0px;padding: 0px; width: 50px;"> ms </b>';
        ticker_element.appendChild(text);
        const button = document.createElement("a");
        button.className = "button";
        button.innerHTML = "Start";
        ticker_element.appendChild(button);
        // functionality
        this.time = this.sliderVariableTracker(this.time.value, slider_value, input_slider);
        var ticker_interval_input = document.getElementById("tickerInterval");
        ticker_interval_input.addEventListener("input", (e) => { this.ticker_interval = Number(ticker_interval_input.value); });
        var ticking = false;
        button.addEventListener("click", (e) => {
            if (ticking) {
                button.innerHTML = "Start";
                ticking = false;
                clearInterval(this.ticker);
            }
            else {
                button.innerHTML = "Stop";
                ticking = true;
                this.ticker = setInterval(() => {
                    this.time.value = TickerFunction(this.time.value);
                    this.UpdateScreen(0);
                }, this.ticker_interval);
            }
        });
    }
}
export class Ellipse {
    constructor(x, y, r, w, h) {
        if (workspace == undefined) {
            throw new Error("Workspace is not defined!");
        }
        // create circle
        this.ellipse = document.createElement("div");
        workspace.appendChild(this.ellipse);
        this.ellipse.className = "circle";
        var borderwidth = parseInt(window.getComputedStyle(this.ellipse).borderTopWidth, 10);
        console.log("borderwidth");
        console.log(borderwidth);
        if (r) {
            this.ellipse.style.width = (r * 2).toString() + "px";
            this.ellipse.style.height = (r * 2).toString() + "px";
            this.ellipse.style.left = (x - r - borderwidth).toString() + "px";
            this.ellipse.style.top = (y - r - borderwidth).toString() + "px";
        }
        else if (w && h) {
            this.ellipse.style.width = w.toString() + "px";
            this.ellipse.style.height = h.toString() + "px";
            this.ellipse.style.left = (x - w).toString() + "px";
            this.ellipse.style.top = (y - h).toString() + "px";
        }
    }
    Fill(color, opacity) {
        this.ellipse.style.backgroundColor = color;
        if (opacity)
            this.ellipse.style.opacity = opacity.toString();
        return this;
    }
    Stroke(color, hideBool) {
        this.ellipse.style.borderColor = color;
        if (hideBool == true) {
            this.ellipse.style.border = "rgba(0,0,0,0)";
        }
        return this;
    }
    Draggable() {
        // makeMovable(this.ellipse, this.ellipse)
        return this;
    }
}
export class Line {
    constructor(x1, y1, x2, y2, width) {
        if (workspace == undefined) {
            throw new Error("Workspace is not defined!");
        }
        this.start_coords = [x1, y1];
        this.end_coords = [x2, y2];
        // create line
        var lil_y = this.line = document.createElement("div");
        this.line.className = "line";
        this.line.style.borderWidth = (width / 2).toString() + "px";
        var theta = Math.atan((y2 - y1) / (x2 - x1));
        this.line.style.rotate = theta.toString() + "rad";
        var mag = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
        this.line.style.width = mag.toString() + "px";
        this.line.style.borderRadius = mag.toString() + "px";
        var offset = [(mag - (x2 - x1)) / 2, (y2 - y1) / 2];
        this.line.style.left = (x1 - offset[0]).toString() + "px";
        this.line.style.top = (y1 + offset[1]).toString() + "px";
        workspace.appendChild(this.line);
    }
    Stroke(color, opacity) {
        this.line.style.borderColor = color;
        if (opacity)
            this.line.style.opacity = opacity.toString();
        return this;
    }
    Draggable() {
        // makeMovable(this.line, this.line)
        return this;
    }
    AddTickmarks(tick_len, labels, min, max, y_spacing = 30, x_spacing = 10) {
        var n = Math.floor(Math.max(this.line.getBoundingClientRect().width, this.line.getBoundingClientRect().height) / (250 / 7));
        var slope = [1, (this.end_coords[1] - this.start_coords[1]) / (this.end_coords[0] - this.start_coords[0])];
        slope[1] == Infinity || slope[1] == -Infinity ? slope = [0, 1] : null;
        for (var i = 0; i <= n; i++) {
            var intersection = [
                this.start_coords[0] + i * (this.end_coords[0] - this.start_coords[0]) / n,
                this.start_coords[1] + i * (this.end_coords[1] - this.start_coords[1]) / n,
            ];
            var left_point = [intersection[0] - tick_len * slope[1], intersection[1] - tick_len * slope[0]];
            var right_point = [intersection[0] + tick_len * slope[1], intersection[1] + tick_len * slope[0]];
            const tick = new Line(left_point[0], left_point[1], right_point[0], right_point[1], 1.5);
            tick.line.id = `tick ${i}`;
            tick.line.classList.add("tickmark");
            workspace.appendChild(tick.line);
            if (labels) {
                var tick_slope = [right_point[0] - left_point[0], right_point[1] - left_point[1]];
                tick.line.style.setProperty("--before-content", `"${((min + i * (max - min) / n)).toFixed(2).toString()}"`);
                tick.line.style.setProperty("--before-y", `${-6}px`);
                tick.line.style.setProperty("--before-x", `${-y_spacing * slope[1] + x_spacing * slope[0]}px`);
                var rotation = -(Math.atan(tick_slope[1] / tick_slope[0]));
                tick.line.style.setProperty("--before-rotation", `${rotation}rad`);
            }
        }
        return this;
    }
    Remove() {
        this.line.remove();
        const tickmarks = document.querySelectorAll('.line.tickmark');
        tickmarks.forEach(element => {
            element.remove();
        });
    }
}
export class Rectangle {
    constructor(x, y, width, height) {
        this.rect = document.createElement("div");
        this.rect.className = "rect";
        this.rect.style.width = width.toString() + "px";
        this.rect.style.height = height.toString() + "px";
        this.rect.style.left = (x - width / 2).toString() + "px";
        this.rect.style.top = (y - height / 2).toString() + "px";
        workspace.appendChild(this.rect);
    }
    Fill(color, opacity) {
        this.rect.style.backgroundColor = color;
        if (opacity)
            this.rect.style.opacity = opacity.toString();
        return this;
    }
    Stroke(showStroke, color, width) {
        color ? this.rect.style.borderColor = color : null;
        width ? this.rect.style.borderWidth = width + "px" : null;
        showStroke == false ? this.rect.style.border = "rgba(0,0,0,0)" : null;
        return this;
    }
    Draggable() {
        // makeMovable(this.rect, this.rect)
        return this;
    }
}
export class UnitVector {
    constructor(x1, y1, x2, y2, color = "white") {
        var theta = Math.atan((y2 - y1) / (x2 - x1));
        x2 - x1 < 0 ? theta += Math.PI : null;
        var mag = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
        var arrowhead_hypo = Math.sqrt(Math.pow((0.2 * mag), 2) + Math.pow((0.05 * mag), 2));
        var arrowhead_angle = Math.PI - Math.atan((0.05 * mag) / (0.2 * mag));
        var arrow_h = 0.3 * mag;
        var arrow_w = arrow_h / 2;
        var stroke_width = mag / 20;
        var arrow_end_pos = [x2 - 2 * arrow_w * Math.cos(theta), y2 - 2 * arrow_w * Math.sin(theta)];
        var vector_line = new Line(x1 - stroke_width / 2, y1 - stroke_width / 2, arrow_end_pos[0] - stroke_width / 2, arrow_end_pos[1] - stroke_width / 2, stroke_width);
        vector_line.Stroke(color);
        vector_line.line.style.borderRadius = "0px";
        var offset = [
            (arrow_h - stroke_width) / 2 * Math.cos(Math.PI / 2 - theta),
            -(arrow_h - stroke_width) / 2 * Math.sin(Math.PI / 2 - theta)
        ];
        theta >= Math.PI / 2 || theta <= Math.PI ? offset[0] += stroke_width * Math.cos(theta) : null;
        theta >= 3 * Math.PI / 2 || theta <= 2 * Math.PI ? offset[0] += stroke_width * Math.sin(theta) : null;
        var vec_arrow = document.createElement("div");
        vec_arrow.style.position = "absolute";
        vec_arrow.style.left = ((arrow_end_pos[0] - stroke_width / 2) + offset[0]).toString() + "px";
        vec_arrow.style.top = ((arrow_end_pos[1] - stroke_width / 2) + offset[1]).toString() + "px";
        vec_arrow.style.borderTop = arrow_w.toString() + "px solid transparent";
        vec_arrow.style.borderBottom = arrow_w.toString() + "px solid transparent";
        vec_arrow.style.borderLeft = arrow_h.toString() + "px solid " + String(color);
        vec_arrow.style.transformOrigin = "0% 0%";
        // console.log("trans origin")
        // console.log(vec_arrow.style.transformOrigin)
        vec_arrow.style.rotate = theta.toString() + "rad";
        workspace.appendChild(vec_arrow);
    }
}
export class Graph {
    constructor(x, y, width, height, background = true) {
        this.stroke_width = 2;
        this.x_range = [0, 10];
        this.y_range = [0, 10];
        [this.dims, this.pos] = [[width, height], [x, y]];
        const padding = 10;
        if (background) {
            const fig = new Rectangle(x + 35 / 2 - 30, y + 10, width + 2 * padding + 35, height + 2 * padding + 20).Fill("black").Stroke(false);
        }
        this.plotArea = new Rectangle(x - this.stroke_width, y - this.stroke_width, width, height).Fill("black").Stroke(true, "white", 2);
        this.UpdateAxes(this.x_range, this.y_range);
        // functionality: the data listener that takes in and plots everything
        const varListener = {
            set: (target, prop, value, receiver) => {
                console.log(`${prop} changed from ${target[prop]} to ${value}`);
                target[prop] = value;
                this.UpdateGraph(target.points, target.lines, target.vectors);
                if (prop == "points") {
                    this.UpdatePoints(value);
                }
                else if (prop == "lines") {
                    this.UpdateLines(value);
                }
                else if (prop == "vectors") {
                    this.UpdateVectors(value);
                }
                else if (prop == "functions") {
                    this.UpdateFunctions(value);
                }
                else {
                    throw new Error("property not recognized");
                }
                return true;
            },
        };
        this.GraphData = new Proxy({
            points: [],
            lines: [],
            vectors: [],
            fucntions: []
        }, varListener);
    }
    // graphics
    UpdateAxes(x_range, y_range) {
        if (this.x_axis && this.y_axis) {
            this.x_axis.Remove();
            this.y_axis.Remove();
        }
        this.x_axis = new Line(this.pos[0] - this.dims[0] / 2, this.pos[1] + this.dims[1] / 2, this.pos[0] + this.dims[0] / 2, this.pos[1] + this.dims[1] / 2, this.stroke_width).AddTickmarks(4, true, x_range[0], x_range[1]);
        this.y_axis = new Line(this.pos[0] - this.dims[0] / 2, this.pos[1] + this.dims[1] / 2, this.pos[0] - this.dims[0] / 2, this.pos[1] - this.dims[1] / 2, this.stroke_width).AddTickmarks(4, true, y_range[0], y_range[1]);
        workspace.insertBefore(this.x_axis.line, this.plotArea.rect);
        this.x_range = x_range;
        this.y_range = y_range;
    }
    PltPosToPxPos(pos, axis) {
        if (axis == "x") {
            var relative_pos = (pos - this.x_range[0]) / (this.x_range[1] - this.x_range[0]);
            return (this.dims[0] * relative_pos);
        }
        else if (axis == "y") {
            var relative_pos = 1 - ((pos - this.y_range[0]) / (this.y_range[1] - this.y_range[0]));
            return (this.dims[1] * relative_pos);
        }
        else {
            throw new Error("PltPosToPxPos: invalid axis arg");
        }
    }
    // GraphData functions
    UpdateGraph(points, lines, vectors) {
        var combined_points = points.map((point) => { return (point.slice(0, 2)); });
        var combined_lines = [];
        lines.map((line) => { line.slice(0, 2).forEach((element) => { combined_lines.push(element); }); });
        console.log("combined lines");
        console.log(combined_lines);
        var combined_vectors = [];
        vectors.map((vect) => { vect.slice(0, 2).forEach((element) => { combined_lines.push(element); }); });
        var combined_elements = combined_points.concat(combined_lines).concat(combined_vectors); // not including functions
        // set graph ranges
        combined_elements.sort(function (a, b) { return a[0] - b[0]; });
        this.x_range = [combined_elements[0][0], combined_elements[combined_elements.length - 1][0]];
        combined_elements.sort(function (a, b) { return a[1] - b[1]; });
        this.y_range = [combined_elements[0][1], combined_elements[combined_elements.length - 1][1]];
        var x_padding = 0.2 * (this.x_range[1] - this.x_range[0]);
        var y_padding = 0.2 * (this.y_range[1] - this.y_range[0]);
        x_padding > 50 ? x_padding = 50 : null;
        y_padding > 50 ? y_padding = 50 : null;
        this.x_range = [this.x_range[0] - x_padding, this.x_range[1] + x_padding];
        this.y_range = [this.y_range[0] - y_padding, this.y_range[1] + y_padding];
        this.UpdateAxes(this.x_range, this.y_range);
    }
    UpdatePoints(points) {
        // 0=x, 1=y, 2=s, 3=c
        // clear children
        var prev_datapoints = document.querySelectorAll("#data_point");
        prev_datapoints.forEach(element => element.remove());
        // plot pointss
        points.forEach((point) => {
            var data_point = new Ellipse(this.PltPosToPxPos(point[0], "x"), this.PltPosToPxPos(point[1], "y"), point[2]);
            data_point.Fill(point[3]).Stroke("white", true);
            data_point.ellipse.id = "data_point";
            this.plotArea.rect.appendChild(data_point.ellipse);
        });
    }
    UpdateLines(lines) {
        var prev_lines = document.querySelectorAll("#data_line");
        console.log(prev_lines);
        prev_lines.forEach(element => element.remove());
        console.log(this.plotArea.rect.innerHTML);
        // plot pointss
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            console.log(line);
            // var data_point = new Ellipse(200, 200, point[2])
            var data_line = new Line(this.PltPosToPxPos(line[0][0], 'x'), this.PltPosToPxPos(line[0][1], 'y'), this.PltPosToPxPos(line[1][0], 'x'), this.PltPosToPxPos(line[1][1], 'y'), line[2]);
            data_line.line.id = "data_line";
            this.plotArea.rect.appendChild(data_line.line);
        }
    }
    UpdateVectors(vectors) {
        var prev_vectors = document.querySelectorAll("#data_vector");
        console.log(prev_vectors);
        prev_vectors.forEach(element => element.remove());
        console.log(this.plotArea.rect.innerHTML);
        // plot points
        for (var i = 0; i < vectors.length; i++) {
            var line = vectors[i];
            console.log(line);
            // var data_point = new Ellipse(200, 200, point[2])
            var data_line = new Line(this.PltPosToPxPos(line[0][0], 'x'), this.PltPosToPxPos(line[0][1], 'y'), this.PltPosToPxPos(line[1][0], 'x'), this.PltPosToPxPos(line[1][1], 'y'), line[2]);
            data_line.line.id = "data_line";
            this.plotArea.rect.appendChild(data_line.line);
        }
    }
    UpdateFunctions(functions) {
    }
    // custom array operations
    // functionality: / actually doing stuff
    Scatter(X, Y, s, c) {
        if (X.length == Y.length) {
            null;
        }
        else {
            throw new Error("X and Y arrays are different lengths");
        }
        if (s == undefined) {
            s = new Array(X.length).fill(2);
        }
        else {
            typeof s === "number" ? s = new Array(X.length).fill(s) : null;
        } // size param regularization (makes array)
        if (X.length == s.length) {
            null;
        }
        else {
            throw new Error("X/Y and size arrays are different lengths");
        }
        if (c == undefined) {
            c = new Array(X.length).fill("white");
        }
        else {
            typeof c === "string" || typeof c[0] === "number" ? c = new Array(X.length).fill(c) : null;
        } // color param regularization (makes array)
        if (X.length == c.length) {
            null;
        }
        else {
            throw new Error("X/Y and color arrays are different lengths");
        }
        for (var i = 0; i < X.length; i++) {
            var point = [X[i], Y[i], s[i], c[i]];
            this.GraphData.points = this.GraphData.points.concat([point]);
        }
        console.log(this.GraphData.points);
    }
    Plot(X, Y, width, grpahPoints = false) {
        if (X.length == Y.length) {
            null;
        }
        else {
            throw new Error("X and Y arrays are different lengths");
        }
        var lines = [];
        for (var i = 0; i < X.length; i++) {
            lines.push([X[i], Y[i]]);
        }
        lines.sort(function (a, b) { return a[0] - b[0]; });
        for (var i = 0; i < lines.length; i++) {
            if (grpahPoints) {
                var point = [lines[i][0], lines[i][1], 2, "white"];
                this.GraphData.points = this.GraphData.points.concat([point]);
            }
            if (i > 0) {
                var line = [
                    [lines[i - 1][0], lines[i - 1][1]],
                    [lines[i][0], lines[i][1]],
                    width
                ];
                this.GraphData.lines = this.GraphData.lines.concat([line]);
            }
        }
    }
    VectorQuiver(X, Y, THETA, R, colors) {
    }
}
export class VectorField {
    constructor(x, y, width, height, dxdt, dydt) {
        this.x_range = [0, 10];
        this.y_range = [0, 10];
        this.graph = new Graph(x, y, width, height, true);
        // proxy declaration for listening
        const varListener = {
            set: (target, prop, value, receiver) => {
                console.log(`${prop} changed from ${target[prop]} to ${value}`);
                target[prop] = value;
                var [x_padding, y_padding] = [0.2 * (this.x_range[1] - this.x_range[0]), 0.2 * (this.y_range[1] - this.y_range[0])];
                this.graph.UpdateAxes([this.x_range[0] - x_padding, this.x_range[1] + x_padding], [this.y_range[0] - y_padding, this.y_range[1] + y_padding]);
                if (prop == "value") {
                    this.graph.UpdateVectors(target[prop]);
                }
                return true;
            },
        };
        this.vectors = new Proxy({ values: [] }, varListener);
    }
    ParticleFlow(X, Y, time) {
    }
}
// LOCAL FUNCTIONS
function rgbToHex(rgbArray) {
    return "#" + rgbArray
        .map(value => {
        const hex = value.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    })
        .join("");
}
function vector_heater(mag, min_mag, max_mag) {
    var i = 4.2 * (mag - min_mag) / (max_mag - min_mag);
    const sinfunc = (M) => { 0.5 * Math.sin((Math.PI / 3) * i + M); };
    const M_arr = [Math.PI / 2 - 0.6, -0.6, -Math.PI / 2 - 0.6];
    var color_addon = M_arr.map(sinfunc);
    var rgb_arr = [];
    for (let i = 0; i < 3; i++) {
        rgb_arr.push([0.5, 0.5, 0.5][i] + color_addon[i]);
    }
    return rgbToHex(rgb_arr);
}
function dotProduct(v1, v2) {
    if (v1.length !== v2.length) {
        throw new Error('Vectors must have the same length');
    }
    let result = 0;
    for (let i = 0; i < v1.length; i++) {
        result += v1[i] * v2[i];
    }
    return result;
}
function magnitude(vector) { return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2)); }
function flatten(arr) {
    return arr.reduce((flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
    }, []);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
// ANOTHER FILE
// const Testing = (runtimeVars, time) => {
//     var [x, y, length, width] = runtimeVars
//     SetWorkspace(document.createElement("div"))
//     // const circ = new Ellipse(100,100,time,undefined,undefined).Draggable()
//     // const lin = new Line(100,100, time, length_width, 4)
//     // const gr = new Graph(x, y, length, width, false)
//     // gr.Plot([1,2,3,1,25,62,15,24,52,105], [3,2,1,12,52,15,52,12,562,21], 1.75, true)
//     const ve = new UnitVector(100,100,time, time, "green")
//     const ci = new Ellipse(time,time,1)
// }
// SetWorkspace(document.createElement("div")) // init workspace
// const runtime = new Runtime(Testing)        // init Runtime
// runtime.CreateTicker(DefaultTicker)
// runtime.varNumber("x", 0, 500)   // set desired vars
// runtime.varNumber("y", 0, 300)   // set desired vars
// runtime.varNumber("length", 0, 500)   // set desired vars
// runtime.varNumber("width", 0, 500)   // set desired vars
// runtime.UpdateScreen(0)
