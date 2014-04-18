/**
 * Merges `from` into `to` without overwriting
 * existing properties of `to`.
 *
 * @param {Object} to
 * @param {Object} from
 */
exports.merge = function merge(to, from) {
  var keys = Object.keys(from), i = keys.length, key;
  while (i--) {
    key = keys[i];
    if ('undefined' === typeof to[key]) {
      to[key] = from[key];
    } else {
      merge(to[key], from[key]);
    }
  }
};
/**
 * Generates a random string
 *
 * @api private
 */
exports.random = function () {
  return Math.random().toString().substr(3);
};
/**
 * Pluralization rules.
 */
var rules = [
    [
      /(m)an$/gi,
      '$1en'
    ],
    [
      /(pe)rson$/gi,
      '$1ople'
    ],
    [
      /(child)$/gi,
      '$1ren'
    ],
    [
      /^(ox)$/gi,
      '$1en'
    ],
    [
      /(ax|test)is$/gi,
      '$1es'
    ],
    [
      /(octop|vir)us$/gi,
      '$1i'
    ],
    [
      /(alias|status)$/gi,
      '$1es'
    ],
    [
      /(bu)s$/gi,
      '$1ses'
    ],
    [
      /(buffal|tomat|potat)o$/gi,
      '$1oes'
    ],
    [
      /([ti])um$/gi,
      '$1a'
    ],
    [
      /sis$/gi,
      'ses'
    ],
    [
      /(?:([^f])fe|([lr])f)$/gi,
      '$1$2ves'
    ],
    [
      /(hive)$/gi,
      '$1s'
    ],
    [
      /([^aeiouy]|qu)y$/gi,
      '$1ies'
    ],
    [
      /(x|ch|ss|sh)$/gi,
      '$1es'
    ],
    [
      /(matr|vert|ind)ix|ex$/gi,
      '$1ices'
    ],
    [
      /([m|l])ouse$/gi,
      '$1ice'
    ],
    [
      /(quiz)$/gi,
      '$1zes'
    ],
    [
      /s$/gi,
      's'
    ],
    [
      /$/gi,
      's'
    ]
  ];
/**
 * Uncountable words.
 */
var uncountables = [
    'advice',
    'energy',
    'excretion',
    'digestion',
    'cooperation',
    'health',
    'justice',
    'labour',
    'machinery',
    'equipment',
    'information',
    'pollution',
    'sewage',
    'paper',
    'money',
    'species',
    'series',
    'rain',
    'rice',
    'fish',
    'sheep',
    'moose',
    'deer',
    'news'
  ];
/**
 * Pluralize function.
 *
 * @author TJ Holowaychuk (extracted from _ext.js_)
 * @param {String} string to pluralize
 * @api private
 */
exports.pluralize = function (str) {
  var rule, found;
  if (!~uncountables.indexOf(str.toLowerCase())) {
    found = rules.filter(function (rule) {
      return str.match(rule[0]);
    });
    if (found[0])
      return str.replace(found[0][0], found[0][1]);
  }
  return str;
};