import _ from 'lodash'
/**
 * Return the bottom coordinate of the layout.
 *
 * @param  {Array} layout Layout array.
 * @return {Number}       Bottom coordinate.
 */
export function bottom (layout) {
    let max = 0
    let bottomY
    for (let i = 0, len = layout.length; i < len; i++) {
        bottomY = layout[i].y + layout[i].h
        if (bottomY > max) max = bottomY
    }
    return max
}

export function cloneLayout (layout) {
    const newLayout = Array(layout.length)
    for (let i = 0, len = layout.length; i < len; i++) {
        newLayout[i] = cloneLayoutItem(layout[i])
    }
    return newLayout
}

// Fast path to cloning, since this is monomorphic
export function cloneLayoutItem (layoutItem) {
    /* return {
  w.w, h.h, x.x, y.y, i.i,
  minW.minW, maxW.maxW, minH.minH, maxH.maxH,
  moved: Boolean(layoutItem.moved), static: Boolean(layoutItem.static),
  // These can be null
  isDraggable.isDraggable, isResizable.isResizable
}; */
    // 深拷贝
    return _.cloneDeep(layoutItem)
    // return JSON.parse(JSON.stringify(layoutItem))
}

/**
 * Given two layoutitems, check if they collide.
 *
 * @return {Boolean}   True if colliding.
 */
export function collides (l1, l2) {
    if (l1 === l2) return false // same element
    if (l1.x + l1.w <= l2.x) return false // l1 is left of l2
    if (l1.x >= l2.x + l2.w) return false // l1 is right of l2
    if (l1.y + l1.h <= l2.y) return false // l1 is above l2
    if (l1.y >= l2.y + l2.h) return false // l1 is below l2
    return true // boxes overlap
}

/**
 * Given a layout, compact it. This involves going down each y coordinate and removing gaps
 * between items.
 *
 * @param  {Array} layout Layout.
 * @param  {Boolean} verticalCompact Whether or not to compact the layout
 *   vertically.
 * @return {Array}       Compacted Layout.
 */
export function compact (layout, verticalCompact) {
    // Statics go in the compareWith array right away so items flow around them.
    const compareWith = getStatics(layout)
    // We go through the items by row and column.
    const sorted = sortLayoutItemsByRowCol(layout)
    // Holding for new items.
    const out = Array(layout.length)

    for (let i = 0, len = sorted.length; i < len; i++) {
        let l = sorted[i]

        // Don't move static elements
        if (!l.static) {
            l = compactItem(compareWith, l, verticalCompact)

            // Add to comparison array. We only collide with items before this one.
            // Statics are already in this array.
            compareWith.push(l)
        }

        // Add to output array to make sure they still come out in the right order.
        out[layout.indexOf(l)] = l

        // Clear moved flag, if it exists.
        l.moved = false
    }

    return out
}

/**
 * Compact an item in the layout.
 */
export function compactItem (compareWith, l, verticalCompact) {
    if (verticalCompact) {
        // Move the element up as far as it can go without colliding.
        while (l.y > 0 && !getFirstCollision(compareWith, l)) {
            l.y--
        }
    }

    // Move it down, and keep moving it down if it's colliding.
    let collides
    while ((collides = getFirstCollision(compareWith, l))) {
        l.y = collides.y + collides.h
    }
    return l
}

/**
 * Given a layout, make sure all elements fit within its bounds.
 *
 * @param  {Array} layout Layout array.
 * @param  {Number} bounds Number of columns.
 */
export function correctBounds (layout, bounds) {
    const collidesWith = getStatics(layout)
    const cols = bounds.cols
    const originalCols = bounds.originalCols
    if (originalCols < cols) {
        setLayoutForEmptyArea(layout, originalCols, cols)
    } else {
        const overItemArr = []// 用于统计超出布局的元素
        for (let i = 0, len = layout.length; i < len; i++) {
            const l = layout[i]
            // Overflows right
            if (l.x + l.w > cols) {
                // 使之一直靠右排布
                overItemArr.push(l)
                l.x = cols - l.w
            }
            // Overflows left
            if (l.x < 0) {
                l.x = 0
                l.w = cols
            }
            if (!l.static) collidesWith.push(l)
            else {
                // If this is static and collides with other statics, we must move it down.
                // We have to do something nicer than just letting them overlap.
                while (getFirstCollision(collidesWith, l)) {
                    l.y++
                }
            }
        }
        setLayoutForOverItems(cols, overItemArr, layout)
    }
    return layout
}

/**
 * 给超出布局的item设置新的定位
 * @param {number} cols 当前布局下的列数
 * @param {Array} overArr 超出布局之外的item
 * @param {Array} layout 所有的布局item
 */
export function setLayoutForOverItems (cols, overArr, layout) {
    if (!overArr.length) return []
    const count = layout.length - overArr.length
    // 每一层布局几个
    const countPerLayer = cols / 3
    let item = overArr.shift()

    // 布局了几层
    let layers = Math.floor(count / countPerLayer)
    // 最后一层布局了几个
    let alreadyCount = count % countPerLayer
    while (item) {
        if (countPerLayer !== 1) {
            if (alreadyCount) {
                item.x = 3 * alreadyCount
                item.y = 10 * layers
                if (++alreadyCount === countPerLayer) {
                    layers++
                    alreadyCount = 0
                }
            } else {
                item.x = 0
                item.y = 10 * layers

                alreadyCount = 1
            }
        } else {
            item.x = cols - item.w
        }
        item = overArr.shift()
    }
}
export function setLayoutForEmptyArea (layout, originalCols, cols) {
    const totalItemCount = layout.length
    // 原来布局多少列
    const oldColumns = originalCols / 3
    // eslint-disable-next-line no-useless-return
    if (totalItemCount > oldColumns) {
        // 表示第一行已经布局几个item
        const count = originalCols / 3
        // 表示可以布局几列
        const columns = cols / 3
        // 表示可以布局几行
        const rows = Math.ceil(totalItemCount / columns)
        let index = count
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns && index < totalItemCount; j++) {
                if (i === 0) {
                    if (index >= columns) {
                        break
                    }
                    layout[index].x = layout[index].w * index
                    layout[index].y = 0
                } else {
                    layout[index].x = layout[index].w * j
                    layout[index].y = layout[index].h * i
                }
                index++
            }
        }
    }
}
/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 *
 * @param  {Array}  layout Layout array.
 * @param  {String} id     ID
 * @return {LayoutItem}    Item at ID.
 */
export function getLayoutItem (layout, id) {
    for (let i = 0, len = layout.length; i < len; i++) {
        if (layout[i].i === id) return layout[i]
    }
}

/**
 * Returns the first item this layout collides with.
 * It doesn't appear to matter which order we approach this from, although
 * perhaps that is the wrong thing to do.
 *
 * @param  {Object} layoutItem Layout item.
 * @return {Object|undefined}  A colliding layout item, or undefined.
 */
export function getFirstCollision (layout, layoutItem) {
    for (let i = 0, len = layout.length; i < len; i++) {
        if (collides(layout[i], layoutItem)) return layout[i]
    }
}

export function getAllCollisions (layout, layoutItem) {
    return layout.filter((l) => collides(l, layoutItem))
}

/**
 * Get all static elements.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of static layout items..
 */
export function getStatics (layout) {
    // return [];
    return layout.filter((l) => l.static)
}

/**
 * Move an element. Responsible for doing cascading movements of other elements.
 *
 * @param  {Array}      layout Full layout to modify.
 * @param  {LayoutItem} l      element to move.
 * @param  {Number}     [x]    X position in grid units.
 * @param  {Number}     [y]    Y position in grid units.
 * @param  {Boolean}    [isUserAction] If true, designates that the item we're moving is
 *                                     being dragged/resized by th euser.
 */
export function moveElement (layout, l, x, y, isUserAction, preventCollision) {
    if (l.static) return layout

    // Short-circuit if nothing to do.
    // if (l.y === y && l.x === x) return layout;

    const oldX = l.x
    const oldY = l.y

    const movingUp = y && l.y > y
    // This is quite a bit faster than extending the object
    if (typeof x === 'number') l.x = x
    if (typeof y === 'number') l.y = y
    l.moved = true

    // If this collides with anything, move it.
    // When doing this comparison, we have to sort the items we compare with
    // to ensure, in the case of multiple collisions, that we're getting the
    // nearest collision.
    let sorted = sortLayoutItemsByRowCol(layout)
    if (movingUp) sorted = sorted.reverse()
    const collisions = getAllCollisions(sorted, l)

    if (preventCollision && collisions.length) {
        l.x = oldX
        l.y = oldY
        l.moved = false
        return layout
    }

    // Move each item that collides away from this element.
    for (let i = 0, len = collisions.length; i < len; i++) {
        const collision = collisions[i]
        // console.log('resolving collision between', l.i, 'at', l.y, 'and', collision.i, 'at', collision.y);

        // Short circuit so we can't infinite loop
        if (collision.moved) continue

        // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
        if (l.y > collision.y && l.y - collision.y > collision.h / 4) continue

        // Don't move static items - we have to move *this* element away
        if (collision.static) {
            layout = moveElementAwayFromCollision(layout, collision, l, isUserAction)
        } else {
            layout = moveElementAwayFromCollision(layout, l, collision, isUserAction)
        }
    }

    return layout
}

/**
 * This is where the magic needs to happen - given a collision, move an element away from the collision.
 * We attempt to move it up if there's room, otherwise it goes below.
 *
 * @param  {Array} layout            Full layout to modify.
 * @param  {LayoutItem} collidesWith Layout item we're colliding with.
 * @param  {LayoutItem} itemToMove   Layout item we're moving.
 * @param  {Boolean} [isUserAction]  If true, designates that the item we're moving is being dragged/resized
 *                                   by the user.
 */
export function moveElementAwayFromCollision (layout, collidesWith,
    itemToMove, isUserAction) {
    const preventCollision = false // we're already colliding
    // If there is enough space above the collision to put this element, move it there.
    // We only do this on the main collision as this can get funky in cascades and cause
    // unwanted swapping behavior.
    if (isUserAction) {
        // Make a mock item so we don't modify the item here, only modify in moveElement.
        const fakeItem = {
            x: itemToMove.x,
            y: itemToMove.y,
            w: itemToMove.w,
            h: itemToMove.h,
            i: '-1'
        }
        fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0)
        if (!getFirstCollision(layout, fakeItem)) {
            return moveElement(layout, itemToMove, undefined, fakeItem.y, preventCollision)
        }
    }

    // Previously this was optimized to move below the collision directly, but this can cause problems
    // with cascading moves, as an item may actually leapflog a collision and cause a reversal in order.
    return moveElement(layout, itemToMove, undefined, itemToMove.y + 1, preventCollision)
}

/**
 * Helper to convert a number to a percentage string.
 *
 * @param  {Number} num Any number
 * @return {String}     That number as a percentage.
 */
export function perc (num) {
    return num * 100 + '%'
}

export function setTransform (top, left, width, height) {
    // Replace unitless items with px
    const translate = 'translate3d(' + left + 'px,' + top + 'px, 0)'
    return {
        transform: translate,
        WebkitTransform: translate,
        MozTransform: translate,
        msTransform: translate,
        OTransform: translate,
        width: width + 'px',
        height: height + 'px',
        position: 'absolute'
    }
}
/**
 * Just like the setTransform method, but instead it will return a negative value of right.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {{transform, WebkitTransform, MozTransform, msTransform, OTransform, width, height, position}}
 */
export function setTransformRtl (top, right, width, height) {
    // Replace unitless items with px
    const translate = 'translate3d(' + right * -1 + 'px,' + top + 'px, 0)'
    return {
        transform: translate,
        WebkitTransform: translate,
        MozTransform: translate,
        msTransform: translate,
        OTransform: translate,
        width: width + 'px',
        height: height + 'px',
        position: 'absolute'
    }
}

export function setTopLeft (top, left, width, height) {
    return {
        top: top + 'px',
        left: left + 'px',
        width: width + 'px',
        height: height + 'px',
        position: 'absolute'
    }
}
/**
 * Just like the setTopLeft method, but instead, it will return a right property instead of left.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {{top, right, width, height, position}}
 */
export function setTopRight (top, right, width, height) {
    return {
        top: top + 'px',
        right: right + 'px',
        width: width + 'px',
        height: height + 'px',
        position: 'absolute'
    }
}

/**
 * Get layout items sorted from top left to right and down.
 *
 * @return {Array} Array of layout objects.
 * @return {Array}        Layout, sorted static items first.
 */
export function sortLayoutItemsByRowCol (layout) {
    return [].concat(layout).sort(function (a, b) {
        if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
            return 1
        }
        return -1
    })
}

/**
 * Validate a layout. Throws errors.
 *
 * @param  {Array}  layout        Array of layout items.
 * @param  {String} [contextName] Context name for errors.
 * @throw  {Error}                Validation error.
 */
export function validateLayout (layout, contextName) {
    contextName = contextName || 'Layout'
    const subProps = ['x', 'y', 'w', 'h']
    if (!Array.isArray(layout)) throw new Error(contextName + ' must be an array!')
    for (let i = 0, len = layout.length; i < len; i++) {
        const item = layout[i]
        for (let j = 0; j < subProps.length; j++) {
            if (typeof item[subProps[j]] !== 'number') {
                throw new Error('VueGridLayout: ' + contextName + '[' + i + '].' + subProps[j] + ' must be a number!')
            }
        }
        if (item.i && typeof item.i !== 'string') {
            // number is also ok, so comment the error
            // TODO confirm if commenting the line below doesn't cause unexpected problems
            // throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i must be a string!');
        }
        if (item.static !== undefined && typeof item.static !== 'boolean') {
            throw new Error('VueGridLayout: ' + contextName + '[' + i + '].static must be a boolean!')
        }
    }
}

// Flow can't really figure this out, so we just use Object
export function autoBindHandlers (el, fns) {
    fns.forEach((key) => {
        el[key] = el[key].bind(el);
        return el[key];
    })
}

/**
 * Convert a JS object to CSS string. Similar to React's output of CSS.
 * @param obj
 * @returns {string}
 */
export function createMarkup (obj) {
    var keys = Object.keys(obj)
    if (!keys.length) return ''
    var i; var len = keys.length
    var result = ''

    for (i = 0; i < len; i++) {
        var key = keys[i]
        var val = obj[key]
        result += hyphenate(key) + ':' + addPx(key, val) + ';'
    }

    return result
}

/* The following list is defined in React's core */
export var IS_UNITLESS = {
    animationIterationCount: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridRow: true,
    gridColumn: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,

    // SVG-related properties
    fillOpacity: true,
    stopOpacity: true,
    strokeDashoffset: true,
    strokeOpacity: true,
    strokeWidth: true
}

/**
 * Will add px to the end of style values which are Numbers.
 * @param name
 * @param value
 * @returns {*}
 */
export function addPx (name, value) {
    if (typeof value === 'number' && !IS_UNITLESS[name]) {
        return value + 'px'
    } else {
        return value
    }
}

/**
 * Hyphenate a camelCase string.
 *
 * @param {String} str
 * @return {String}
 */

export var hyphenateRE = /([a-z\d])([A-Z])/g

export function hyphenate (str) {
    return str.replace(hyphenateRE, '$1-$2').toLowerCase()
}

export function findItemInArray (array, property, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][property] === value) { return true }
    }

    return false
}

export function findAndRemove (array, property, value) {
    array.forEach(function (result, index) {
        if (result[property] === value) {
            // Remove from array
            array.splice(index, 1)
        }
    })
}
